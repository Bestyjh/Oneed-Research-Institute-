import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Briefcase, CheckCircle2, Globe2, Star } from 'lucide-react';
import ScrollBaseAnimation from '../components/ui/scroll-text-marque';
import ShieldedBadge from '../components/ShieldedBadge';
import blogPosts from '../data/blogPosts.json';

const BLOG_POSTS = blogPosts;
const HERO_SLIDES = [
  {
    title: 'International | Intercultural | Interdisciplinary',
    headline: 'Research-Driven Education for a Global, Inclusive Future',
    text: 'Empowering students, educators, and organizations with world-class research skills, professional development, and accredited certifications.',
    image: 'https://images.pexels.com/photos/6684506/pexels-photo-6684506.jpeg?cs=srgb&dl=pexels-andy-barbour-6684506.jpg&fm=jpg',
    ctaPrimary: { label: 'View Academic Programs', to: '/services#courses' },
    ctaSecondary: { label: 'Our Services', to: '/services' }
  },
  {
    title: 'Global Partnerships',
    headline: 'Connecting Institutions with Research Excellence',
    text: 'We collaborate with universities, colleges, and high schools to deliver research-led programs and conferences.',
    image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?cs=srgb&dl=pexels-fauxels-3184465.jpg&fm=jpg',
    ctaPrimary: { label: 'View Academic Programs', to: '/services#courses' },
    ctaSecondary: { label: 'Our Services', to: '/services' }
  },
  {
    title: 'Inclusive Access',
    headline: 'Building Research Capacity for Emerging Communities',
    text: 'We design equitable learning pathways and global networks for underserved and early-career learners.',
    image: 'https://images.pexels.com/photos/5212697/pexels-photo-5212697.jpeg?cs=srgb&dl=pexels-katerina-holmes-5212697.jpg&fm=jpg',
    ctaPrimary: { label: 'View Academic Programs', to: '/services#courses' },
    ctaSecondary: { label: 'Our Services', to: '/services' }
  }
];
const NEWS_ITEMS = [
  { title: 'Research Skills Summit 2026 announced', date: 'January 29, 2026' },
  { title: 'New publication: Research Literacy Toolkit', date: 'January 27, 2026' },
  { title: 'Call for partners: Global Youth Research Cohort', date: 'January 2, 2026' },
  { title: 'Conference report: Education Impact Forum 2025', date: 'December 29, 2025' },
  { title: 'Now published: Oneed Research Journal Vol. 1', date: 'December 26, 2025' },
  { title: 'Open call: Research in Emerging Communities', date: 'December 19, 2025' }
];
const FEATURED_HIGHLIGHTS = [
  {
    title: 'Global Research Partnerships',
    description: 'Interdisciplinary collaborations connecting educators, institutions, and communities.'
  },
  {
    title: 'Inclusive Learning Pathways',
    description: 'Programs designed to expand access for underserved and early-career learners.'
  },
  {
    title: 'Applied Research Support',
    description: 'Practical guidance for research execution, publication, and institutional impact.'
  }
];
const WORK_ITEMS = [
  { title: 'Events', desc: 'Global conferences and workshops connecting educators, institutions, and learners.' },
  { title: 'Journals', desc: 'Open-access journals aligned with international academic standards.' },
  { title: 'Research Centre', desc: 'Applied research, policy insights, and interdisciplinary collaboration.' },
  { title: 'Research Archive', desc: 'A growing repository of research projects and educational resources.' },
  { title: 'Grants & Scholarships', desc: 'Support for early-career researchers and emerging communities.' },
  { title: 'Membership', desc: 'Join a global network of educators and research leaders.' }
];
const SERVICES = [
  { icon: <Globe2 className="h-7 w-7" />, title: 'Conferences & Events', desc: 'World-class academic events with excellence, care, and integrity.' },
  { icon: <Briefcase className="h-7 w-7" />, title: 'Academic Project Management', desc: 'End-to-end delivery of research projects, training, and capacity building.' },
  { icon: <BadgeCheck className="h-7 w-7" />, title: 'Research & Consulting', desc: 'Original research, analysis, and advisory for institutions and organizations.' }
];
const JOURNAL_ISSUES = [
  { title: 'Now Published: Volume 1 Issue 3 – Studies in Education', date: 'December 16, 2025' },
  { title: 'Now Published: Volume 1 Issue 2 – Technology in Education', date: 'August 25, 2025' },
  { title: 'Now Published: Volume 1 Issue 1 – Language Learning in Education', date: 'June 9, 2025' }
];
const THINK_ARTICLES = [
  { title: 'Cooperating in Difficult Times: Making Interdisciplinarity Work', author: 'Apipol Sae-Tung' },
  { title: 'Supporting International Students to Adjust to Academic Culture', author: 'James Underwood' },
  { title: 'Technological Innovations in Educational Tools', author: 'Remilyn Mueller & Jeff Cranmore' },
  { title: 'Embracing Joy: A Light Through the Tunnel of Teacher Burnout', author: 'Derek Porter' }
];
const LATEST_PUBLICATION = BLOG_POSTS.reduce((latest, post) => {
  if (!post?.date) return latest;
  const currentDate = new Date(post.date);
  if (Number.isNaN(currentDate.getTime())) return latest;
  if (!latest) return post;
  const latestDate = new Date(latest.date);
  return currentDate > latestDate ? post : latest;
}, null);

function HeroSection() {
  const [heroIndex, setHeroIndex] = useState(0);
  const isPausedRef = useRef(false);

  useEffect(() => {
    const handler = (event) => {
      isPausedRef.current = Boolean(event?.detail?.open);
    };
    window.addEventListener('oneed-chat-toggle', handler);
    return () => window.removeEventListener('oneed-chat-toggle', handler);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isPausedRef.current) return;
      setHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden px-6 py-20 lg:py-28">
      <div
        className="absolute inset-0 hero-slider-bg"
        style={{ backgroundImage: `url('${HERO_SLIDES[heroIndex].image}')` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--ink)]/85 via-[var(--ink)]/65 to-[var(--ink)]/10"></div>
      <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="text-white hero-contrast">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
            {HERO_SLIDES[heroIndex].title}
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-white md:text-6xl">
            {HERO_SLIDES[heroIndex].headline}
          </h1>
          <p className="mt-6 max-w-xl text-base text-white/80 md:text-lg">
            {HERO_SLIDES[heroIndex].text}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to={HERO_SLIDES[heroIndex].ctaPrimary.to} className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--ink)] shadow-xl shadow-black/20 transition hover:-translate-y-0.5">
              {HERO_SLIDES[heroIndex].ctaPrimary.label}
            </Link>
            <Link to={HERO_SLIDES[heroIndex].ctaSecondary.to} className="rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              {HERO_SLIDES[heroIndex].ctaSecondary.label}
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Academic Credibility', text: 'Led by experienced researchers' },
              { label: 'Inclusive Access', text: 'Designed for diverse learners' },
              { label: 'Impact-Oriented', text: 'Measurable outcomes' }
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/10 px-4 py-4">
                <div className="text-2xl font-semibold">{stat.label}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/70">{stat.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="glass-panel p-8 text-[var(--ink)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">Client Care</div>
                <h3 className="mt-2 text-2xl font-semibold">Your success is the plan.</h3>
              </div>
              <div className="rounded-full bg-[var(--accent)] p-3 text-[var(--ink)]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm text-[var(--muted)]">
              <div className="flex items-start gap-3">
                <ShieldedBadge />
                <span>Programs led by experienced academics from universities and research institutes.</span>
              </div>
              <div className="flex items-start gap-3">
                <ShieldedBadge />
                <span>Inclusive, globally accessible offerings for underserved and emerging communities.</span>
              </div>
              <div className="flex items-start gap-3">
                <ShieldedBadge />
                <span>Collaborations with universities, colleges, and high schools in Canada and internationally.</span>
              </div>
            </div>
            <div className="mt-8 rounded-2xl bg-[var(--ink)] text-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/60">Next Cohort</div>
                  <div className="text-lg font-semibold">Applications now open</div>
                </div>
                <Link to="/services" className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[var(--ink)]">
                  View Programs
                </Link>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 hidden w-48 rounded-2xl bg-[var(--accent-2)] p-4 text-white shadow-xl shadow-emerald-900/30 lg:block">
            <div className="text-xs uppercase tracking-[0.3em] text-white/70">Trusted</div>
            <div className="mt-2 text-lg font-semibold">Trusted by Institutions</div>
            <div className="mt-2 flex items-center gap-1 text-[var(--accent)]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-10 mt-10 flex justify-center gap-3">
        {HERO_SLIDES.map((_, index) => (
          <button
            key={`slide-${index}`}
            type="button"
            onClick={() => setHeroIndex(index)}
            className={`h-2.5 w-2.5 rounded-full transition ${
              heroIndex === index ? 'bg-white' : 'bg-white/40'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          ></button>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <section className="px-6 py-12">
        <div className="mx-auto max-w-6xl rounded-3xl bg-[var(--ink)]/95 py-8 text-white">
          <ScrollBaseAnimation delay={500} baseVelocity={-3} clasname="font-bold tracking-[-0.07em] leading-[90%] text-4xl md:text-6xl text-[var(--accent-2)]">
            Research with Purpose
          </ScrollBaseAnimation>
          <ScrollBaseAnimation delay={500} baseVelocity={3} clasname="font-bold tracking-[-0.07em] leading-[90%] text-4xl md:text-6xl text-[var(--accent)]">
            Learn with Global Impact
          </ScrollBaseAnimation>
        </div>
      </section>

      <section className="bg-[var(--surface)] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-xs uppercase tracking-[0.4em] text-[var(--accent-2)]">Work With Us</div>
          <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Our Services</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {SERVICES.map((service) => (
              <div key={service.title} className="rounded-3xl bg-white p-6 shadow-lg shadow-black/5">
                <div className="rounded-2xl bg-[var(--accent)]/20 p-3 text-[var(--ink)]">
                  {service.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{service.title}</h3>
                <p className="mt-3 text-sm text-[var(--muted)]">{service.desc}</p>
                <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-2)]" to="/contact">
                  Learn More <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-[var(--accent-2)]">News</div>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Latest updates</h2>
            <div className="mt-6 space-y-4">
              {NEWS_ITEMS.map((item) => (
                <div key={item.title} className="rounded-2xl border border-[var(--ink)]/10 bg-[var(--surface)] px-5 py-4">
                  <div className="text-xs text-[var(--muted)]">{item.date}</div>
                  <div className="mt-2 text-sm font-semibold text-[var(--ink)]">{item.title}</div>
                </div>
              ))}
            </div>
            <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-2)]" to="/blog">
              More Articles <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-[32px] bg-[var(--ink)] p-8 text-white">
            <div className="text-xs uppercase tracking-[0.4em] text-white/70">Featured Highlights</div>
            <h3 className="mt-3 text-2xl font-semibold">What we are building</h3>
            <div className="mt-6 space-y-4">
              {FEATURED_HIGHLIGHTS.map((item) => (
                <div key={item.title} className="rounded-2xl bg-white/10 p-4">
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div className="mt-3 text-xs text-white/70">{item.description}</div>
                </div>
              ))}
            </div>
            <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white" to="/services">
              Explore Services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-xs uppercase tracking-[0.4em] text-[var(--accent-2)]">Our Work</div>
          <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Research, publications, and partnerships</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {WORK_ITEMS.map((item) => (
              <div key={item.title} className="rounded-3xl bg-white p-6 shadow-lg shadow-black/5">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm text-[var(--muted)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-[var(--accent-2)]">Oneed Research Journal</div>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Latest Issues</h2>
            {LATEST_PUBLICATION && (
              <div className="mt-6 rounded-2xl border border-[var(--ink)]/10 bg-[var(--surface)] px-5 py-4">
                <div className="text-xs uppercase tracking-[0.3em] text-[var(--accent-2)]">Latest Publication</div>
                <div className="mt-2 text-sm font-semibold text-[var(--ink)]">{LATEST_PUBLICATION.title}</div>
                <div className="mt-2 text-xs text-[var(--muted)]">{LATEST_PUBLICATION.date}</div>
                <Link className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-2)]" to={`/blog/${LATEST_PUBLICATION.slug}`}>
                  Read Publication <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
            <div className="mt-6 space-y-4">
              {JOURNAL_ISSUES.map((issue) => (
                <div key={issue.title} className="rounded-2xl border border-[var(--ink)]/10 bg-white px-5 py-4">
                  <div className="text-xs text-[var(--muted)]">{issue.date}</div>
                  <div className="mt-2 text-sm font-semibold text-[var(--ink)]">{issue.title}</div>
                </div>
              ))}
            </div>
            <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-2)]" to="/blog">
              Visit Journal Homepage <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-[32px] bg-[var(--ink)] p-8 text-white">
            <div className="text-xs uppercase tracking-[0.4em] text-white/70">Think Platform</div>
            <h3 className="mt-3 text-2xl font-semibold">Latest Articles</h3>
            <div className="mt-6 space-y-4">
              {THINK_ARTICLES.map((article) => (
                <div key={article.title} className="rounded-2xl bg-white/10 p-4">
                  <div className="text-sm font-semibold">{article.title}</div>
                  <div className="mt-2 text-xs text-white/70">by {article.author}</div>
                </div>
              ))}
            </div>
            <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white" to="/blog">
              Visit THINK <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[32px] bg-[var(--ink)] p-8 text-white">
            <div className="text-xs uppercase tracking-[0.4em] text-white/70">International | Intercultural | Interdisciplinary</div>
            <h2 className="mt-4 text-3xl font-semibold">About Oneed Research Institute</h2>
            <p className="mt-4 text-sm text-white/80">
              Oneed Institute is a mission-driven, independent educational institute dedicated to encouraging
              interdisciplinary discussion, facilitating intercultural awareness, and promoting international exchange
              through research-driven education.
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-[var(--accent-2)]">News & Blog</div>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Latest Articles</h2>
            <div className="mt-6 space-y-4">
              {BLOG_POSTS.slice(0, 3).map((post) => (
                <div key={post.title} className="rounded-2xl border border-[var(--ink)]/10 bg-[var(--surface)] px-5 py-4">
                  <div className="text-xs text-[var(--muted)]">{post.date}</div>
                  <div className="mt-2 text-sm font-semibold text-[var(--ink)]">{post.title}</div>
                </div>
              ))}
            </div>
            <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-2)]" to="/blog">
              More Articles <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="cta-strip flex flex-wrap items-center justify-between gap-6 rounded-[32px] p-10 text-white">
            <div>
              <div className="text-xs uppercase tracking-[0.4em] text-white/70">Work With Us</div>
              <h3 className="mt-3 text-3xl font-semibold">Ready to join the future of research-driven education?</h3>
              <p className="mt-2 text-sm text-white/80">
                Explore programs, partner with us, or request a tailored consultation.
              </p>
            </div>
            <Link to="/contact" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--ink)]">
              Book a Consultation
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
