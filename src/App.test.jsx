import { render, screen, waitFor } from '@testing-library/react';
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