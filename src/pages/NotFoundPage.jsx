import React from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero';

export default function NotFoundPage() {
  return (
    <>
      <PageHero
        eyebrow="404"
        title="We couldn't find that page."
        description="The page you are looking for doesn't exist or has moved."
      />
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 text-center shadow-xl shadow-black/5">
          <h2 className="text-2xl font-semibold">Let us help you get back on track.</h2>
          <p className="mt-4 text-sm text-[var(--muted)]">
            Visit our services or contact us for a tailored consultation.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/services" className="rounded-full border border-[var(--ink)] px-6 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-white">
              View Services
            </Link>
            <Link to="/contact" className="rounded-full bg-[var(--accent-2)] px-6 py-2 text-sm font-semibold text-white">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
