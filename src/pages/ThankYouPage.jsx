import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageHero from '../components/PageHero';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ThankYouPage() {
  const query = useQuery();
  const ref = query.get('ref');

  return (
    <>
      <PageHero
        eyebrow="Thank You"
        title="Your request is confirmed."
        description="We will respond within one business day."
        breadcrumbLabel="Thank You"
      />
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-emerald-200 bg-emerald-50 p-10 text-center text-emerald-900">
          <h2 className="text-2xl font-semibold">We have received your request.</h2>
          <p className="mt-3 text-sm text-emerald-900/80">
            A member of our team will reach out shortly with next steps.
          </p>
          {ref && (
            <div className="mt-4 rounded-full bg-white px-4 py-2 text-xs font-semibold text-emerald-800">
              Reference ID: {ref}
            </div>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/services" className="rounded-full bg-[var(--accent-2)] px-6 py-2 text-sm font-semibold text-white">
              Explore Services
            </Link>
            <Link to="/" className="rounded-full border border-emerald-700/30 px-6 py-2 text-sm font-semibold text-emerald-800">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
