import React from 'react';
import PageHero from '../components/PageHero';
import ServiceDetail from '../components/ServiceDetail';

export default function ConferencesPage() {
  return (
    <>
      <PageHero
        eyebrow="Conferences"
        title="Conferences, seminars, and academic events."
        description="Global events that foster collaboration, publishing opportunities, and interdisciplinary exchange."
      />
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl grid gap-8">
          <ServiceDetail
            id="events"
            title="Upcoming Conferences"
            description="Planned conferences and seminar series with regional and global participation."
            points={[
              'International speaker tracks',
              'Hybrid and in-person participation',
              'Submission and review support'
            ]}
          />
          <ServiceDetail
            id="past"
            title="Past Conference Highlights"
            description="Key outputs and outcomes from our previous academic conferences."
            points={[
              'Conference proceedings summaries',
              'Featured paper showcases',
              'Impact and participation reports'
            ]}
          />
        </div>
      </section>
    </>
  );
}
