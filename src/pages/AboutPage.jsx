import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import PageHero from '../components/PageHero';

export default function AboutPage() {
  const teamMembers = [
    {
      name: 'Academic Programs Team',
      role: 'Curriculum & Pedagogy',
      image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=1200'
    },
    {
      name: 'Research Advisory Team',
      role: 'Research Methods & Impact',
      image: 'https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=1200'
    },
    {
      name: 'Community Engagement Team',
      role: 'Partnerships & Inclusion',
      image: 'https://images.pexels.com/photos/1181359/pexels-photo-1181359.jpeg?auto=compress&cs=tinysrgb&w=1200'
    }
  ];

  return (
    <>
      <PageHero
        eyebrow="About Oneed"
        title="Research-driven education for a global, inclusive future."
        description="Founded by a team of academic researchers motivated by the passion to educate, facilitate, and empower young people through research."
      />
      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative overflow-hidden rounded-[32px] bg-[var(--ink)] text-white">
            <div className="absolute inset-0 odogwu-about-bg"></div>
            <div className="relative p-8">
              <div className="text-xs uppercase tracking-[0.3em] text-white/70">Who We Are</div>
              <h2 className="mt-4 text-3xl font-semibold">Welcome to Oneed Research Institute</h2>
              <p className="mt-4 text-sm text-white/80">
                As the global education landscape continues to evolve amid rapid technological advancement,
                research competence has become an essential skill for learners at all levels, particularly for
                young people preparing for a knowledge-driven future. Oneed Institute is built on this understanding.
              </p>
              <div className="mt-6 grid gap-3 text-sm">
                {['Academic credibility', 'Inclusive global access', 'Impact-oriented outcomes'].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--accent)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-3 text-sm">
                {[
                  'Fully incorporated and registered in Canada (January 2026)',
                  'Committed to equity, access, and inclusion',
                  'Dedicated to measurable social impact'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--accent)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="rounded-[32px] bg-white p-8 shadow-xl shadow-black/5">
              <div className="text-xs uppercase tracking-[0.3em] text-[var(--accent-2)]">Why Oneed</div>
              <h3 className="mt-4 text-2xl font-semibold">We combine academic excellence with ethical practice.</h3>
              <p className="mt-4 text-sm text-[var(--muted)]">
                Led by highly qualified academics with experience across research institutes, universities, and
                colleges, we collaborate with leading institutions in Canada and internationally to deliver
                high-quality short courses, professional training, diploma programs, and degree-linked certifications.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  'Short courses & certifications',
                  'Conferences, seminars, and workshops',
                  'Professional development programs',
                  'Structured onboarding solutions'
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-[var(--ink)]/10 bg-[var(--surface)] px-4 py-3 text-sm">
                    {item}
                  </div>
                ))}
              </div>
              <Link to="/contact" className="mt-8 inline-flex rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-white">
                Meet Our Consultants
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-xs uppercase tracking-[0.4em] text-[var(--accent-2)]">Our Team</div>
          <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Built by Researchers, Educators, and Mentors</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {teamMembers.map((member) => (
              <article key={member.name} className="team-clippath-card">
                <img
                  src={member.image}
                  alt={`${member.name} - ${member.role}`}
                  width={1200}
                  height={900}
                  loading="lazy"
                  decoding="async"
                  className="h-72 w-full object-cover"
                />
                <div className="team-clippath-overlay">
                  <h3 className="text-xl font-semibold">{member.name}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.24em] text-white/80">{member.role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
