import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero';

export default function SignupPage({ onSignup }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await onSignup(formData);
    if (!result.ok) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }
    setError('');
    if (result.needsEmailVerification) {
      setNotice('Account created. Please check your email to verify your account before logging in.');
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <PageHero
        eyebrow="Account"
        title="Create your visitor account."
        description="Sign up to access your Oneed account."
      />
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-xl rounded-[32px] border border-[var(--ink)]/10 bg-[var(--surface)] p-8">
          <h2 className="text-2xl font-semibold">Sign Up</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Create your account in less than a minute.</p>
          <div className="mt-4 rounded-2xl border border-[var(--accent)]/40 bg-white px-4 py-3 text-sm text-[var(--ink)]">
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--accent-2)]">Member Access</div>
            <div className="mt-2 font-semibold">Global Youth Research Cohort 2026</div>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Create your account to access cohort applications, membership benefits, and program updates.
            </p>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Eligibility guides for grants and awards are public — no account required to view them.
            </p>
            <Link to="/contact" className="mt-3 inline-flex text-xs font-semibold text-[var(--accent-2)]">
              Ask about membership tiers
            </Link>
            <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
              <a className="text-[var(--accent-2)] underline-offset-4 hover:underline" href="/grants-eligibility-guide.txt">
                View Grants Guide
              </a>
              <a className="text-[var(--accent-2)] underline-offset-4 hover:underline" href="/awards-eligibility-guide.txt">
                View Awards Guide
              </a>
            </div>
          </div>
          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {notice && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {notice}
            </div>
          )}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="signup-name" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Full Name</label>
              <input
                id="signup-name"
                className="mt-2 w-full rounded-full border border-[var(--ink)]/20 bg-white px-4 py-3 text-sm focus:border-[var(--accent-2)] focus:outline-none"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your full name"
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Email</label>
              <input
                id="signup-email"
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
              <label htmlFor="signup-password" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Password</label>
              <input
                id="signup-password"
                className="mt-2 w-full rounded-full border border-[var(--ink)]/20 bg-white px-4 py-3 text-sm focus:border-[var(--accent-2)] focus:outline-none"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Minimum 6 characters"
              />
            </div>
            <div>
              <label htmlFor="signup-confirm-password" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Confirm Password</label>
              <input
                id="signup-confirm-password"
                className="mt-2 w-full rounded-full border border-[var(--ink)]/20 bg-white px-4 py-3 text-sm focus:border-[var(--accent-2)] focus:outline-none"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Repeat password"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[var(--accent-2)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          <p className="mt-5 text-sm text-[var(--muted)]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[var(--accent-2)]">
              Log in
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
