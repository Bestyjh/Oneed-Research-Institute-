import React from 'react';
import PageHero from '../components/PageHero';
import ServiceDetail from '../components/ServiceDetail';

export default function AwardsPage() {
  return (
    <>
      <PageHero
        eyebrow="Awards"
        title="Recognition and impact awards."
        description="Celebrating educational excellence, innovation, and measurable social impact."
      />
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl grid gap-8">
          <ServiceDetail
            id="recognition"
            title="Recognition Programs"
            description="Structured recognition pathways for educators, researchers, and institutions."
            points={[
              'Category-based recognition tracks',
              'Transparent evaluation criteria',
              'Institutional and individual awards'
            ]}
          />
          <ServiceDetail
            id="impact"
            title="Impact Awards"
            description="Awards focused on measurable educational and community outcomes."
            points={[
              'Impact evidence requirements',
              'Independent review and panel support',
              'Annual recognition cycles'
            ]}
          />
          <div className="rounded-[32px] border border-[var(--ink)]/10 bg-[var(--surface)] p-8">
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--accent-2)]">Eligibility Checklist</div>
            <h3 className="mt-3 text-2xl font-semibold">Prepare your nomination</h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Documented outcomes and measurable impact</li>
              <li>Nomination letter or institutional endorsement</li>
              <li>Evidence of innovation or community benefit</li>
              <li>Supporting materials (media, publications, testimonials)</li>
            </ul>
            <a
              href="/awards-eligibility-guide.txt"
              className="mt-6 inline-flex rounded-full bg-[var(--accent-2)] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5"
              download
            >
              Download Awards Guide
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
