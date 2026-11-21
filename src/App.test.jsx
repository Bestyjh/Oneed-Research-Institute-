import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import App from './App';
import { StrictMode } from 'react';

vi.mock('./lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      initialize: vi.fn(),
      getUser: vi.fn(),
    },
  },
}));

function LocationObserver() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  vi.clearAllMocks();
    supabase.auth.initialize.mockResolvedValue({
    error: null,
  });

  supabase.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });

  supabase.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });

  supabase.auth.onAuthStateChange.mockReturnValue({
    data: {
      subscription: {
        unsubscribe: vi.fn(),
      },
    },
  });
});

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LocationObserver />
      <App />
    </MemoryRouter>
  );
}

test('renders the homepage content', async () => {
  renderAt('/');

  expect(
    await screen.findByRole('heading', { name: 'Our Services' })
  ).toBeInTheDocument();

  expect(screen.getByTestId('current-path'))
    .toHaveTextContent(/^\/$/);
});

test('renders the About page content', async () => {
  renderAt('/about');

  expect(
    await screen.findByRole('heading', {
      name: 'Welcome to Oneed Research Institute',
    })
  ).toBeInTheDocument();

  expect(screen.getByTestId('current-path'))
    .toHaveTextContent('/about');
});

test('renders the login form', async () => {
  renderAt('/login');

  expect(
    await screen.findByRole('heading', { name: 'Log In' })
  ).toBeInTheDocument();

  expect(
    screen.getByPlaceholderText('you@email.com')
  ).toBeInTheDocument();

  expect(
    screen.getByPlaceholderText('Your password')
  ).toBeInTheDocument();
});

test('redirects unauthenticated account access to login', async () => {
  renderAt('/account');

  await waitFor(() => {
    expect(screen.getByTestId('current-path'))
      .toHaveTextContent(/^\/login$/);
  });

  expect(
    await screen.findByRole('heading', { name: 'Log In' })
  ).toBeInTheDocument();
});

test('renders the not-found page for unknown routes', async () => {
  renderAt('/this-page-does-not-exist');

  expect(
    await screen.findByRole('heading', {
      name: 'Let us help you get back on track.',
    })
  ).toBeInTheDocument();

  expect(screen.getByTestId('current-path'))
    .toHaveTextContent('/this-page-does-not-exist');
});

test('renders the application correctly under React Strict Mode', async () => {
  render(
    <StrictMode>
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    </StrictMode>
  );

  expect(
    await screen.findByRole('heading', { name: 'Log In' })
  ).toBeInTheDocument();

  expect(
    screen.getByPlaceholderText('you@email.com')
  ).toBeInTheDocument();
});

test('opens and closes the Oneed Chat widget', async () => {
  renderAt('/');

  const chatButton = await screen.findByRole('button', {
    name: 'Chat with Oneed',
  });

  expect(
    screen.queryByText('Oneed Assistant')
  ).not.toBeInTheDocument();

  fireEvent.click(chatButton);

  expect(
    await screen.findByText('Oneed Assistant')
  ).toBeInTheDocument();

  expect(
    screen.getByPlaceholderText('Ask about Oneed services...')
  ).toBeInTheDocument();

  fireEvent.click(
  screen.getByRole('button', {
    name: 'Close chat',
  })
);

  await waitFor(() => {
    expect(
      screen.queryByText('Oneed Assistant')
    ).not.toBeInTheDocument();
  });
});

test('sends a Chat message and displays a mocked AI reply', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        reply: 'ONEED provides professional development programs.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  );

  try {
    renderAt('/');

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Chat with Oneed',
      })
    );

    const input = await screen.findByPlaceholderText(
      'Ask about Oneed services...'
    );

    fireEvent.change(input, {
      target: { value: 'What programs does ONEED offer?' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Send message' })
    );

    expect(
      await screen.findByText(
        'ONEED provides professional development programs.'
      )
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe('/api/chat');
    expect(options.method).toBe('POST');

    expect(JSON.parse(options.body).messages).toEqual(
      expect.arrayContaining([
        {
          role: 'user',
          content: 'What programs does ONEED offer?',
        },
      ])
    );
  } finally {
    fetchMock.mockRestore();
  }
});

test('displays a rate-limit warning when Chat API returns HTTP 429', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(
      JSON.stringify({ error: 'Too many requests' }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  );

  try {
    renderAt('/');

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Chat with Oneed',
      })
    );

    const input = await screen.findByPlaceholderText(
      'Ask about Oneed services...'
    );

    fireEvent.change(input, {
      target: { value: 'Tell me about ONEED programs' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Send message' })
    );

    expect(
      await screen.findByText(
        'You have sent too many messages. Please wait a while before trying again.'
      )
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  } finally {
    fetchMock.mockRestore();
  }
});

test('displays a connection error when the Chat API request fails', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
    new TypeError('Mock network connection failure')
  );

  try {
    renderAt('/');

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Chat with Oneed',
      })
    );

    const input = await screen.findByPlaceholderText(
      'Ask about Oneed services...'
    );

    fireEvent.change(input, {
      target: { value: 'How can I contact ONEED?' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Send message' })
    );

    expect(
      await screen.findByText(
        'I could not connect right now. Please try again, or contact us at info@oneedinstitute.ca.'
      )
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  } finally {
    fetchMock.mockRestore();
  }
});
