import React, { useMemo, useState } from 'react';
import PageHero from '../components/PageHero';
import ServiceDetail from '../components/ServiceDetail';

export default function ResearchPage() {
  const [query, setQuery] = useState('');
  const archiveItems = useMemo(
    () => [
      'Inclusive Education Research Toolkit',
      'Research Literacy Roadmap',
      'Grant Writing Playbook',
      'Faculty Development Strategy',
      'Micro-Credentials Design Guide'
    ],
    []
  );
  const filteredArchive = useMemo(
    () =>
      archiveItems.filter((item) =>
        item.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [archiveItems, query]
  );

  return (
    <>
      <PageHero
        eyebrow="Research"
        title="Research Centre, projects, and archive."
        description="Explore research support, collaborative projects, and open-access resources."
      />
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl grid gap-8">
          <ServiceDetail
            id="centre"
            title="Research Centre"
            description="Applied research support for learners, educators, and institutions."
            points={[
              'Research design and methodology support',
              'Academic writing and publication guidance',
              'Collaborative research advisory'
            ]}
          />
          <ServiceDetail
            id="projects"
            title="Impact Projects"
            description="Project-based initiatives designed for measurable educational and social outcomes."
            points={[
              'End-to-end project planning',
              'Implementation and monitoring support',
              'Impact reporting and evaluation'
            ]}
          />
          <ServiceDetail
            id="archive"
            title="Research Archive"
            description="A curated archive of research outputs, learning resources, and institutional insights."
            points={[
              'Open-access knowledge resources',
              'Structured research repositories',
              'Practical tools for educators and researchers'
            ]}
          />
          <div className="rounded-[32px] border border-[var(--ink)]/10 bg-white p-6 shadow-xl shadow-black/5">
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--accent-2)]">Archive Search</div>
            <h3 className="mt-3 text-2xl font-semibold">Find a research resource</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">Search the archive to access the latest guides and toolkits.</p>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search research resources..."
              className="mt-4 w-full rounded-full border border-[var(--ink)]/20 bg-[var(--surface)] px-4 py-3 text-sm focus:border-[var(--accent-2)] focus:outline-none"
              type="text"
            />
            <div className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
              {filteredArchive.map((item) => (
                <div key={item} className="rounded-2xl border border-[var(--ink)]/10 bg-[var(--surface)] px-4 py-3">
                  {item}
                </div>
              ))}
            </div>
            {query && filteredArchive.length === 0 && (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                <div className="font-semibold">No results found.</div>
                <p className="mt-2">Try a different keyword, or suggest a research topic below.</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {['Inclusive education', 'Grant readiness', 'Teacher training'].map((topic) => (
                    <span key={topic} className="rounded-full bg-white px-3 py-1 text-amber-700">
                      {topic}
                    </span>
                  ))}
                </div>
                <div className="mt-4">
                  <a className="inline-flex rounded-full bg-[var(--accent-2)] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5" href="/contact">
                    Suggest a Research Topic
                  </a>
                </div>
              </div>
            )}
          </div>
          <div className="rounded-[32px] border border-[var(--ink)]/10 bg-[var(--surface)] p-6">
            <div className="text-sm font-semibold">Looking for a topic that is not listed yet?</div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Request a research topic and we will prioritize new additions to the archive.
            </p>
            <div className="mt-4">
              <a
                className="inline-flex rounded-full bg-[var(--accent-2)] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5"
                href="/contact"
              >
                Request a Research Topic
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
