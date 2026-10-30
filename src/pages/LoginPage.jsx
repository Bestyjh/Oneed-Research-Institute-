import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero';

export default function LoginPage({ onLogin }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await onLogin(formData);
    if (!result.ok) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }
    setError('');
    setIsSubmitting(false);
  };

  return (
    <>
      <PageHero
        eyebrow="Account"
        title="Log in to your account."
        description="Access your Oneed account and manage your profile."
      />
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-xl rounded-[32px] border border-[var(--ink)]/10 bg-[var(--surface)] p-8">
          <h2 className="text-2xl font-semibold">Log In</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Use your email and password to continue.</p>
          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Email</label>
              <input
                className="mt-2 w-full rounded-full border border-[var(--ink)]/20 bg-white px-4 py-3 text-sm focus:border-[var(--accent-2)] focus:outline-none"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@email.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Password</label>
              <input
                className="mt-2 w-full rounded-full border border-[var(--ink)]/20 bg-white px-4 py-3 text-sm focus:border-[var(--accent-2)] focus:outline-none"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Your password"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[var(--accent-2)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5"
            >
              {isSubmitting ? 'Logging In...' : 'Log In'}
            </button>
          </form>
          <p className="mt-5 text-sm text-[var(--muted)]">
            New visitor?{' '}
            <Link to="/signup" className="font-semibold text-[var(--accent-2)]">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
