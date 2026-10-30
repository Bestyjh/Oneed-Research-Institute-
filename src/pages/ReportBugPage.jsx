import React, { useEffect, useState } from 'react';
import PageHero from '../components/PageHero';
import { getAccessToken } from '../lib/getAccessToken';

export default function ReportBugPage({ currentUser }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium',
    reporter_email: currentUser?.email || '',
    page_url: ''
  });
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, reporter_email: currentUser?.email || prev.reporter_email }));
  }, [currentUser]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('');

    const token = await getAccessToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch('/api/bugs', {
      method: 'POST',
      headers,
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      setStatus('Failed to submit bug report. Please try again.');
      setIsSubmitting(false);
      return;
    }

    setStatus('Bug report submitted. Thank you.');
    setFormData({
      title: '',
      description: '',
      severity: 'medium',
      reporter_email: currentUser?.email || '',
      page_url: ''
    });
    setIsSubmitting(false);
  };

  return (
    <>
      <PageHero
        eyebrow="Support"
        title="Report a website bug."
        description="Help us improve by sharing what went wrong and where it happened."
      />
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-[var(--ink)]/10 bg-[var(--surface)] p-8">
          <h2 className="text-2xl font-semibold">Report a Bug</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Our team reviews and prioritizes each report.</p>
          {status && (
            <div className="mt-4 rounded-2xl border border-[var(--ink)]/15 bg-white px-4 py-3 text-sm text-[var(--ink)]">
              {status}
            </div>
          )}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-full border border-[var(--ink)]/20 bg-white px-4 py-3 text-sm focus:border-[var(--accent-2)] focus:outline-none"
                placeholder="Short bug summary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={5}
                className="mt-2 w-full rounded-3xl border border-[var(--ink)]/20 bg-white px-4 py-3 text-sm focus:border-[var(--accent-2)] focus:outline-none"
                placeholder="What happened, what you expected, and reproduction steps"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Severity</label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-full border border-[var(--ink)]/20 bg-white px-4 py-3 text-sm focus:border-[var(--accent-2)] focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Email (Optional)</label>
                <input
                  type="email"
                  name="reporter_email"
                  value={formData.reporter_email}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-full border border-[var(--ink)]/20 bg-white px-4 py-3 text-sm focus:border-[var(--accent-2)] focus:outline-none"
                  placeholder="you@email.com"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Page URL (Optional)</label>
              <input
                type="text"
                name="page_url"
                value={formData.page_url}
                onChange={handleChange}
                className="mt-2 w-full rounded-full border border-[var(--ink)]/20 bg-white px-4 py-3 text-sm focus:border-[var(--accent-2)] focus:outline-none"
                placeholder="https://oneed-institute.vercel.app/..."
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-[var(--accent-2)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Bug Report'}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
