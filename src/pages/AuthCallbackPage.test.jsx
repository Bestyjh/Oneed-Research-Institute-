
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import AuthCallbackPage from './AuthCallbackPage';
import { supabase } from '../lib/supabaseClient';
import { StrictMode } from 'react';

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      initialize: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      exchangeCodeForSession: vi.fn(),
    },
  },
}));

function LocationObserver() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

function renderCallback(path, initialAuthCallback = null) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LocationObserver />
      <AuthCallbackPage initialAuthCallback={initialAuthCallback} />
    </MemoryRouter>
  );
}

const validInitialCallback = {
  pathname: '/auth/callback',
  hasCredentials: true,
  hasError: false,
};

beforeEach(() => {
  vi.clearAllMocks();
    supabase.auth.exchangeCodeForSession.mockResolvedValue({
    data: {
      user: null,
      session: null,
    },
    error: new Error('Invalid verification code'),
  });
  vi.useRealTimers();

  supabase.auth.initialize.mockResolvedValue({ error: null });

  supabase.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });
});

supabase.auth.getSession.mockResolvedValue({
  data: { session: null },
  error: null,
});

afterEach(() => {
  vi.useRealTimers();
});

test('rejects a callback without verification credentials', async () => {
  renderCallback('/auth/callback');

  expect(
    await screen.findByText(/verification link is invalid/i)
  ).toBeInTheDocument();

  expect(supabase.auth.initialize).not.toHaveBeenCalled();
  expect(supabase.auth.getUser).not.toHaveBeenCalled();
});

test('rejects a callback without credentials even when signed in', async () => {
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: 'existing-user' } },
    error: null,
  });

  renderCallback('/auth/callback');

  expect(
    await screen.findByText(/verification link is invalid/i)
  ).toBeInTheDocument();

  expect(screen.queryByText(/email verified!/i))
    .not.toBeInTheDocument();

  expect(supabase.auth.getUser).not.toHaveBeenCalled();
});

test('rejects an initialization error despite an existing session', async () => {
  supabase.auth.initialize.mockResolvedValue({
    error: new Error('Invalid verification credentials'),
  });

  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: 'existing-user' } },
    error: null,
  });

  renderCallback('/auth/callback', validInitialCallback);

  expect(
    await screen.findByText(/verification link is invalid/i)
  ).toBeInTheDocument();

  expect(supabase.auth.getUser).not.toHaveBeenCalled();
});

test('rejects credentials not captured during initial page load', async () => {
  renderCallback('/auth/callback?code=untrusted-code');

  expect(
    await screen.findByText(/verification link is invalid/i)
  ).toBeInTheDocument();

  expect(supabase.auth.getUser).not.toHaveBeenCalled();
});

test('rejects an initial callback containing an error', async () => {
  renderCallback('/auth/callback', {
    pathname: '/auth/callback',
    hasCredentials: true,
    hasError: true,
  });

  expect(
    await screen.findByText(/verification link is invalid/i)
  ).toBeInTheDocument();

  expect(supabase.auth.getUser).not.toHaveBeenCalled();
});

test('rejects a PKCE exchange that returns no authenticated session', async () => {
  supabase.auth.exchangeCodeForSession.mockResolvedValue({
    data: {
      user: null,
      session: null,
    },
    error: null,
  });

  renderCallback(
    '/auth/callback?code=no-session-code',
    validInitialCallback
  );

  expect(
    await screen.findByText(/verification link is invalid/i)
  ).toBeInTheDocument();

  expect(
    supabase.auth.exchangeCodeForSession
  ).toHaveBeenCalledWith('no-session-code');

  expect(
    screen.queryByText(/email verified!/i)
  ).not.toBeInTheDocument();
});

test('accepts a successfully exchanged PKCE authorization code', async () => {
  supabase.auth.exchangeCodeForSession.mockResolvedValue({
    data: {
      user: { id: 'verified-user' },
      session: {
        access_token: 'test-access-token',
        user: { id: 'verified-user' },
      },
    },
    error: null,
  });

supabase.auth.getSession.mockResolvedValue({
  data: {
    session: {
      access_token: 'test-access-token',
      user: { id: 'verified-user' },
    },
  },
  error: null,
});

  renderCallback(
    '/auth/callback?code=valid-pkce-code',
    validInitialCallback
  );

  expect(
    await screen.findByText(/email verified!/i)
  ).toBeInTheDocument();

  expect(
    supabase.auth.exchangeCodeForSession
  ).toHaveBeenCalledWith('valid-pkce-code');

  await waitFor(
    () => {
      expect(screen.getByTestId('current-path'))
        .toHaveTextContent('/account');
    },
    { timeout: 3000 }
  );
});

test('rejects an invalid PKCE code even when another user is signed in', async () => {
  supabase.auth.getUser.mockResolvedValue({
    data: {
      user: {
        id: 'existing-user',
        email: 'existing@example.com',
      },
    },
    error: null,
  });

  supabase.auth.exchangeCodeForSession.mockResolvedValue({
    data: {
      user: null,
      session: null,
    },
    error: new Error('Invalid authorization code'),
  });

  renderCallback(
    '/auth/callback?code=invalid-pkce-code',
    validInitialCallback
  );

  expect(
    await screen.findByText(/verification link is invalid/i)
  ).toBeInTheDocument();

  expect(
    supabase.auth.exchangeCodeForSession
  ).toHaveBeenCalledWith('invalid-pkce-code');

  expect(
    screen.queryByText(/email verified!/i)
  ).not.toBeInTheDocument();

  expect(supabase.auth.getUser).not.toHaveBeenCalled();
});
test('exchanges a PKCE code only once under React Strict Mode', async () => {
  supabase.auth.exchangeCodeForSession.mockResolvedValue({
    data: {
      user: { id: 'strict-mode-user' },
      session: {
        access_token: 'strict-mode-access-token',
        user: { id: 'strict-mode-user' },
      },
    },
    error: null,
  });

supabase.auth.getSession.mockResolvedValue({
  data: {
    session: {
      access_token: 'strict-mode-access-token',
      user: { id: 'strict-mode-user' },
    },
  },
  error: null,
});

  render(
    <StrictMode>
      <MemoryRouter
        initialEntries={['/auth/callback?code=strict-mode-code']}
      >
        <AuthCallbackPage
          initialAuthCallback={validInitialCallback}
        />
      </MemoryRouter>
    </StrictMode>
  );

  expect(
    await screen.findByText(/email verified!/i)
  ).toBeInTheDocument();

  expect(
    supabase.auth.exchangeCodeForSession
  ).toHaveBeenCalledTimes(1);

  expect(
    supabase.auth.exchangeCodeForSession
  ).toHaveBeenCalledWith('strict-mode-code');
});
test('does not reuse an expired PKCE exchange cache entry', async () => {
  const code = 'cache-expiry-regression-code';

  supabase.auth.exchangeCodeForSession.mockResolvedValue({
    data: {
      user: null,
      session: null,
    },
    error: new Error('Invalid authorization code'),
  });

  const first = renderCallback(
    `/auth/callback?code=${code}`,
    validInitialCallback
  );

  expect(
    await screen.findByText(/verification link is invalid/i)
  ).toBeInTheDocument();

  expect(
    supabase.auth.exchangeCodeForSession
  ).toHaveBeenCalledTimes(1);

  first.unmount();

  // Advance the system clock beyond the cache's 30-second TTL.
  vi.useFakeTimers({
  toFake: ['Date'],
});
  const currentTime = Date.now();
  vi.setSystemTime(currentTime + 31_000);

  try {
    renderCallback(
      `/auth/callback?code=${code}`,
      validInitialCallback
    );

    await waitFor(() => {
      expect(
        supabase.auth.exchangeCodeForSession
      ).toHaveBeenCalledTimes(2);
    });
  } finally {
    vi.useRealTimers();
  }
});

test('rejects a cached successful PKCE exchange after logout', async () => {
  const code = 'logout-replay-regression-code';
  const user = { id: 'replay-test-user' };

  supabase.auth.exchangeCodeForSession.mockResolvedValue({
    data: {
      user,
      session: {
        access_token: 'replay-test-token',
        user,
      },
    },
    error: null,
  });

  // First callback: the exchange establishes an authenticated session.
  supabase.auth.getSession.mockResolvedValue({
    data: {
      session: {
        access_token: 'replay-test-token',
        user,
      },
    },
    error: null,
  });

  const first = renderCallback(
    `/auth/callback?code=${code}`,
    validInitialCallback
  );

  expect(
    await screen.findByText(/email verified!/i)
  ).toBeInTheDocument();

  expect(
    supabase.auth.exchangeCodeForSession
  ).toHaveBeenCalledTimes(1);

  first.unmount();

  // Simulate logout: the browser no longer has a session.
  supabase.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });

  // Revisit the same callback within the cache's 30-second TTL.
  renderCallback(
    `/auth/callback?code=${code}`,
    validInitialCallback
  );

  expect(
    await screen.findByText(/verification link is invalid/i)
  ).toBeInTheDocument();

  expect(
    screen.queryByText(/email verified!/i)
  ).not.toBeInTheDocument();

  // The cached exchange is reused, but cannot establish success.
  expect(
    supabase.auth.exchangeCodeForSession
  ).toHaveBeenCalledTimes(1);

  expect(
    supabase.auth.getSession
  ).toHaveBeenCalledTimes(2);
});
