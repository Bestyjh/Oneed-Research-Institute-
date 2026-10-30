import React from 'react';
import PageHero from '../components/PageHero';
import ServiceDetail from '../components/ServiceDetail';

export default function GrantsPage() {
  return (
    <>
      <PageHero
        eyebrow="Grants & Scholarships"
        title="Funding pathways for researchers and learners."
        description="Support for grant readiness, scholarship opportunities, and partner-backed funding channels."
      />
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl grid gap-8">
          <div className="rounded-[32px] border border-[var(--ink)]/10 bg-[var(--surface)] p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--accent-2)]">Application Status</div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold text-emerald-700">
                Applications Open
              </span>
              <span className="text-xs text-[var(--muted)]">Updated for the current cycle.</span>
            </div>
            <div className="mt-3 text-xs text-[var(--muted)]">
              Eligibility checklists are public — no account required until you submit an application.
            </div>
          </div>
          <ServiceDetail
            id="grants"
            title="Grant Opportunity Support"
            description="Guidance to identify, prepare, and submit competitive grant applications."
            points={[
              'Funding source discovery',
              'Proposal development support',
              'Compliance and submission readiness'
            ]}
          />
          <ServiceDetail
            id="scholarships"
            title="Scholarship Opportunities"
            description="Scholarship support for early-career researchers and underserved communities."
            points={[
              'Eligibility and profile preparation',
              'Application and personal statement guidance',
              'Mentorship and follow-up support'
            ]}
          />
          <div className="rounded-[32px] border border-[var(--ink)]/10 bg-[var(--surface)] p-8">
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--accent-2)]">Eligibility Checklist</div>
            <h3 className="mt-3 text-2xl font-semibold">Are you grant-ready?</h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Defined research goal and target population</li>
              <li>Clear budget or funding request outline</li>
              <li>Evidence of institutional or community impact</li>
              <li>Timeline with deliverables and milestones</li>
            </ul>
            <a
              href="/grants-eligibility-guide.txt"
              className="mt-6 inline-flex rounded-full bg-[var(--accent-2)] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5"
              download
            >
              Download Eligibility Guide
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
