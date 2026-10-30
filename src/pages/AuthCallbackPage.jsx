import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function AuthCallbackPage() {
  const [status, setStatus] = useState('verifying');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const errorParam = new URLSearchParams(location.hash.slice(1)).get('error');

    if (errorParam) {
      setStatus('error');
      return;
    }

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setStatus('error');
        } else {
          setStatus('success');
          setTimeout(() => window.location.replace('/account'), 1500);
        }
      });
    } else {
      setStatus('success');
      setTimeout(() => window.location.replace('/account'), 1500);
    }
  }, [location]);

  return (
    <section className="bg-white px-6 py-20 min-h-[60vh] flex items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[var(--accent-2)]" />
            <p className="text-sm text-[var(--muted)]">Verifying your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-8 w-8 text-emerald-500" />
            <p className="text-sm text-[var(--muted)]">Email verified! Redirecting to your account…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <X className="mx-auto mb-4 h-8 w-8 text-red-500" />
            <p className="text-sm text-red-600 font-medium">This verification link has expired or is invalid.</p>
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
