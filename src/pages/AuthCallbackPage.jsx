import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Deduplicate PKCE exchanges across React Strict Mode effect replays.
// Retain settled results briefly to prevent immediate duplicate exchanges.
const callbackExchanges = new Map();
const MAX_CACHED_EXCHANGES = 20;
const EXCHANGE_CACHE_TTL_MS = 30_000;

function exchangeCallbackCode(code) {
  const now = Date.now();

  // Remove expired entries before looking up the requested code.
  for (const [key, entry] of callbackExchanges) {
    if (now - entry.createdAt >= EXCHANGE_CACHE_TTL_MS) {
      callbackExchanges.delete(key);
    }
  }

  const existing = callbackExchanges.get(code);

  if (existing) {
    return existing.promise;
  }

  const promise = Promise.resolve().then(() =>
    supabase.auth.exchangeCodeForSession(code)
  );

  callbackExchanges.set(code, {
    promise,
    createdAt: now,
  });

  // Limit retained entries.
  while (callbackExchanges.size > MAX_CACHED_EXCHANGES) {
    const oldestKey = callbackExchanges.keys().next().value;
    callbackExchanges.delete(oldestKey);
  }

  return promise;
}

export default function AuthCallbackPage({ initialAuthCallback = null }) {
  const [status, setStatus] = useState('verifying');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    let redirectTimer;

    async function verify() {
      try {
        const params = new URLSearchParams(location.search);
        const hashParams = new URLSearchParams(location.hash.slice(1));

        const initialCredentialsPresent =
          initialAuthCallback?.pathname === '/auth/callback' &&
          initialAuthCallback?.hasCredentials === true &&
          initialAuthCallback?.hasError !== true;

        if (
          params.has('error') ||
          hashParams.has('error') ||
          !initialCredentialsPresent
        ) {
          if (active) setStatus('error');
          return;
        }

        const code = params.get('code');

        if (!code) {
          if (active) setStatus('error');
          return;
        }

        const { data, error } = await exchangeCallbackCode(code);

       if (error || !data?.session || !data?.user) {
  if (active) setStatus('error');
  return;
}

// Confirm that the exchange corresponds to an active session.
// A cached successful exchange alone is not sufficient.
const {
  data: { session },
  error: sessionError,
} = await supabase.auth.getSession();

if (
  sessionError ||
  !session?.user ||
  session.user.id !== data.user.id
) {
  if (active) setStatus('error');
  return;
}

if (!active) return;

setStatus('success');

        redirectTimer = window.setTimeout(() => {
          navigate('/account', { replace: true });
        }, 1500);
      } catch {
        if (active) setStatus('error');
      }
    }

    verify();

    return () => {
      active = false;
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [location.search, location.hash, navigate, initialAuthCallback]);

  return (
    <section className="bg-white px-6 py-20 min-h-[60vh] flex items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[var(--accent-2)]" />
            <p className="text-sm text-[var(--muted)]">
              Verifying your email…
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-8 w-8 text-emerald-500" />
            <p className="text-sm text-[var(--muted)]">
              Email verified! Redirecting to your account…
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <X className="mx-auto mb-4 h-8 w-8 text-red-500" />
            <p className="text-sm text-red-600 font-medium">
              This verification link is invalid, expired, or could not be verified.
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Please <Link to="/signup" className="underline">sign up again</Link> or{' '}
              <Link to="/login" className="underline">log in</Link> if you already verified.
            </p>
          </>
        )}
      </div>
    </section>
  );
}