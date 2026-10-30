import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import PageHero from '../components/PageHero';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', service: 'consultation' });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [referenceId, setReferenceId] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const validateField = (name, value) => {
    const trimmed = value.trim();
    if (name === 'name') {
      if (!trimmed) return 'Please enter your name.';
      if (trimmed.length < 2) return 'Name must be at least 2 characters.';
    }
    if (name === 'email') {
      if (!trimmed) return 'Please enter your email.';
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(trimmed)) return 'Enter a valid email address.';
    }
    return '';
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'name' || name === 'email') {
      const nextError = validateField(name, value);
      setFieldErrors((prev) => ({ ...prev, [name]: nextError }));
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    if (name === 'name' || name === 'email') {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const nextError = validateField(name, value);
      setFieldErrors((prev) => ({ ...prev, [name]: nextError }));
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setTouched({ name: true, email: true, service: true });

    const nextErrors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email)
    };
    setFieldErrors(nextErrors);
    if (nextErrors.name || nextErrors.email) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          service: formData.service,
          page_url: typeof window !== 'undefined' ? window.location.href : ''
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSubmitError(data?.error || 'Failed to submit request');
        setIsSubmitting(false);
        return;
      }

      const refId = `REF-${Date.now().toString(36).toUpperCase()}`;
      setFormSubmitted(true);
      setReferenceId(refId);
      setShowSuccessModal(true);
      setTimeout(() => setFormSubmitted(false), 3000);
      setFormData({ name: '', email: '', service: 'consultation' });
      setTouched({});
      setFieldErrors({});
    } catch (error) {
      setSubmitError('Could not send your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Get a tailored consultation."
        description="Tell us your goals and our team will respond within one business day."
      />
      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-[var(--accent-2)]">Contact</div>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Get a tailored consultation</h2>
            <p className="mt-4 text-sm text-[var(--muted)]">
              Tell us your goals and our team will respond with the best learning pathway within one business day.
            </p>
            <div className="mt-8 space-y-4 text-sm text-[var(--muted)]">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[var(--accent-2)]" /> (226) 753-2321
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[var(--accent-2)]" /> info@oneedinstitute.ca
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-[var(--accent-2)]" /> 215 Platts Lane, London, Ontario
              </div>
            </div>
            <div className="mt-10 flex items-center gap-4 text-sm font-semibold">
              <span className="rounded-full bg-[var(--surface)] px-4 py-2 text-[var(--ink)]">Institution Ready</span>
              <span className="rounded-full bg-[var(--surface)] px-4 py-2 text-[var(--ink)]">Impact Focused</span>
            </div>
          </div>
          <div className="rounded-[32px] border border-[var(--ink)]/10 bg-[var(--surface)] p-8">
            <h3 className="text-xl font-semibold">Request a Consultation</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">We reply within 24 hours on business days.</p>
            {formSubmitted && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Thank you! We will be in touch shortly. Your reference ID is <span className="font-semibold">{referenceId}</span>.
              </div>
            )}
            {submitError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}
            <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="contact-name" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Name</label>
                <input
                  id="contact-name"
                  className={`mt-2 w-full rounded-full border bg-white px-4 py-3 text-sm focus:outline-none ${fieldErrors.name && touched.name ? 'border-red-300 focus:border-red-400' : 'border-[var(--ink)]/20 focus:border-[var(--accent-2)]'}`}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  onBlur={handleBlur}
                  required
                  placeholder="Your name"
                  aria-invalid={fieldErrors.name && touched.name ? 'true' : 'false'}
                  aria-describedby="contact-name-error"
                />
                {fieldErrors.name && touched.name && (
                  <p id="contact-name-error" className="mt-2 text-xs text-red-600">
                    {fieldErrors.name}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="contact-email" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Email</label>
                <input
                  id="contact-email"
                  className={`mt-2 w-full rounded-full border bg-white px-4 py-3 text-sm focus:outline-none ${fieldErrors.email && touched.email ? 'border-red-300 focus:border-red-400' : 'border-[var(--ink)]/20 focus:border-[var(--accent-2)]'}`}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  onBlur={handleBlur}
                  required
                  placeholder="you@email.com"
                  aria-invalid={fieldErrors.email && touched.email ? 'true' : 'false'}
                  aria-describedby="contact-email-error"
                />
                {fieldErrors.email && touched.email && (
                  <p id="contact-email-error" className="mt-2 text-xs text-red-600">
                    {fieldErrors.email}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="contact-service" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Interest</label>
                <select
                  id="contact-service"
                  className="mt-2 w-full rounded-full border border-[var(--ink)]/20 bg-white px-4 py-3 text-sm focus:border-[var(--accent-2)] focus:outline-none"
                  name="service"
                  value={formData.service}
                  onChange={handleFormChange}
                >
                  <option value="consultation">Initial Consultation</option>
                  <option value="courses">Short Courses</option>
                  <option value="training">Workshops & Training</option>
                  <option value="conferences">Conferences & Seminars</option>
                  <option value="professional">Professional Development</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting ? 'true' : 'false'}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-2)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isSubmitting ? 'Processing...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      </section>
      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--ink)]/60 px-6">
          <div className="w-full max-w-lg rounded-[32px] bg-white p-8 text-center shadow-2xl">
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--accent-2)]">Success</div>
            <h2 className="mt-3 text-2xl font-semibold">Your request is confirmed.</h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              A member of our team will respond within one business day.
            </p>
            {referenceId && (
              <div className="mt-4 inline-flex rounded-full bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--ink)]">
                Reference ID: {referenceId}
              </div>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to={`/thank-you?ref=${encodeURIComponent(referenceId)}`}
                className="rounded-full bg-[var(--accent-2)] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5"
              >
                View Confirmation
              </Link>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="rounded-full border border-[var(--ink)]/20 px-5 py-2 text-xs font-semibold text-[var(--ink)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
