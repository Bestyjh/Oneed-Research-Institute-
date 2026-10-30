import React, { lazy, memo, startTransition, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Loader2,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Send,
  X
} from 'lucide-react';
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import blogPosts from './data/blogPosts.json';
import { supabase } from './lib/supabaseClient';

const BLOG_POSTS = blogPosts;
const SITE_URL = 'https://www.oneedinstitute.ca';
const DEFAULT_TITLE = 'Oneed Research Institute';
const DEFAULT_DESCRIPTION = 'Empowering Global Education Through Research, Innovation, and Inclusion.';
const DEFAULT_KEYWORDS = [
  'Oneed Research Institute',
  'education research institute Canada',
  'professional training Canada',
  'research conferences',
  'grants and scholarships',
  'education for all',
  'inclusive education'
];
const FAQ_ITEMS = [
  {
    q: 'Who does Oneed Institute serve?',
    a: 'Students, educators, institutions, and organizations seeking research-driven learning and professional development.'
  },
  {
    q: 'What programs do you offer?',
    a: 'Short courses, certifications, diploma pathways, workshops, conferences, and training initiatives.'
  },
  {
    q: 'Do you partner with institutions?',
    a: 'Yes. We collaborate with universities, colleges, and secondary schools in Canada and internationally.'
  },
  {
    q: 'How do we start a partnership?',
    a: 'Submit an inquiry and we will respond with a tailored roadmap within one business day.'
  }
];

const HomePage = lazy(() => import('./pages/HomePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ResearchPage = lazy(() => import('./pages/ResearchPage'));
const ConferencesPage = lazy(() => import('./pages/ConferencesPage'));
const GrantsPage = lazy(() => import('./pages/GrantsPage'));
const AwardsPage = lazy(() => import('./pages/AwardsPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ThankYouPage = lazy(() => import('./pages/ThankYouPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const ReportBugPage = lazy(() => import('./pages/ReportBugPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function upsertMeta(selector, attrName, attrValue, content) {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attrName, attrValue);
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
}

function setJsonLdScript(id, payload) {
  const selector = `script[data-seo-jsonld="${id}"]`;
  let node = document.head.querySelector(selector);
  if (!payload) {
    if (node) node.remove();
    return;
  }
  if (!node) {
    node = document.createElement('script');
    node.setAttribute('type', 'application/ld+json');
    node.setAttribute('data-seo-jsonld', id);
    document.head.appendChild(node);
  }
  node.textContent = JSON.stringify(payload);
}

function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname || '/';
    const normalizedPath = path === '/' ? '/' : path.replace(/\/+$/, '');
    const canonicalUrl = `${SITE_URL}${normalizedPath}`;

    // SEO playbook: maintain one primary phrase + related secondary phrases per route.
    const seoByPath = [
      {
        match: /^\/$/,
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        keywords: ['education research institute', 'training and conferences', 'scholarships and grants']
      },
      {
        match: /^\/about$/,
        title: 'About | Oneed Research Institute',
        description: 'Learn about Oneed Research Institute — our mission, team, and commitment to inclusive, research-driven education.',
        keywords: ['about oneed institute', 'education mission canada', 'research institute team']
      },
      {
        match: /^\/services$/,
        title: 'Services | Oneed Research Institute',
        description: 'Explore short courses, professional training, workshops, conferences, and grants offered by Oneed Institute.',
        keywords: ['education services canada', 'short courses research', 'professional training institute']
      },
      {
        match: /^\/research$/,
        title: 'Research | Oneed Research Institute',
        description: 'Discover research support, impact projects, and an open-access archive for educators and learners.',
        keywords: ['academic research support', 'education research archive', 'research impact projects']
      },
      {
        match: /^\/conferences$/,
        title: 'Conferences | Oneed Research Institute',
        description: 'Upcoming and past conferences, seminars, and academic events hosted by Oneed Institute.',
        keywords: ['academic conferences canada', 'education seminars', 'research events']
      },
      {
        match: /^\/grants$/,
        title: 'Grants & Scholarships | Oneed Research Institute',
        description: 'Funding pathways, scholarship opportunities, and grant readiness support for researchers and learners.',
        keywords: ['education grants canada', 'research scholarships', 'funding for researchers']
      },
      {
        match: /^\/awards$/,
        title: 'Awards | Oneed Research Institute',
        description: 'Recognition programs and impact awards celebrating excellence in education and research.',
        keywords: ['education awards canada', 'research recognition', 'impact awards']
      },
      {
        match: /^\/blog$/,
        title: 'Blog | Oneed Research Institute',
        description: 'Insights, updates, and research-driven articles from the Oneed Research Institute.',
        keywords: ['education blog canada', 'research articles', 'learning resources']
      },
      {
        match: /^\/faq$/,
        title: 'FAQ | Oneed Research Institute',
        description: 'Frequently asked questions about Oneed Institute programs, partnerships, and services.',
        keywords: ['oneed faq', 'education institute questions', 'program information']
      },
      {
        match: /^\/contact$/,
        title: 'Contact | Oneed Research Institute',
        description: 'Get in touch with Oneed Institute for a tailored consultation on programs, partnerships, or services.',
        keywords: ['contact oneed institute', 'education consultation canada', 'book consultation']
      },
      {
        match: /^\/login$/,
        title: 'Log In | Oneed Research Institute',
        description: 'Log in to your Oneed Research Institute account.',
        keywords: []
      },
      {
        match: /^\/signup$/,
        title: 'Sign Up | Oneed Research Institute',
        description: 'Create your Oneed Research Institute visitor account.',
        keywords: []
      },
      {
        match: /^\/account$/,
        title: 'Account | Oneed Research Institute',
        description: 'Manage your Oneed Research Institute profile.',
        keywords: []
      },
      {
        match: /^\/report-bug$/,
        title: 'Report a Bug | Oneed Research Institute',
        description: 'Report a website issue to the Oneed team.',
        keywords: ['report website bug', 'oneed support']
      },
      {
        match: /^\/thank-you$/,
        title: 'Thank You | Oneed Research Institute',
        description: 'Your request has been received by Oneed Research Institute.',
        keywords: []
      }
    ];

    let title = DEFAULT_TITLE;
    let description = DEFAULT_DESCRIPTION;
    let keywords = [...DEFAULT_KEYWORDS];
    const noIndexPaths = ['/login', '/signup', '/account', '/report-bug', '/thank-you'];

    if (normalizedPath.startsWith('/blog/')) {
      const slug = normalizedPath.split('/blog/')[1];
      const post = BLOG_POSTS.find((item) => item.slug === slug);
      title = post ? `${post.title} | Oneed Research Institute` : 'Publication | Oneed Research Institute';
      description = post?.excerpt || DEFAULT_DESCRIPTION;
      keywords = post
        ? [post.title, 'education publication', 'research article', ...DEFAULT_KEYWORDS]
        : [...DEFAULT_KEYWORDS];
    } else {
      const found = seoByPath.find((item) => item.match.test(normalizedPath));
      if (found) {
        title = found.title;
        description = found.description;
        keywords = [...DEFAULT_KEYWORDS, ...(found.keywords || [])];
      }
    }

    document.title = title;
    upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    upsertMeta('meta[name="keywords"]', 'name', 'keywords', [...new Set(keywords)].join(', '));
    upsertMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      noIndexPaths.includes(normalizedPath) ? 'noindex, nofollow' : 'index, follow'
    );

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Oneed Research Institute',
      url: SITE_URL
    };

    const faqSchema = normalizedPath === '/faq'
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ_ITEMS.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.a
            }
          }))
        }
      : null;

    let blogSchema = null;
    if (normalizedPath.startsWith('/blog/')) {
      const slug = normalizedPath.split('/blog/')[1];
      const post = BLOG_POSTS.find((item) => item.slug === slug);
      if (post) {
        const parsed = new Date(post.date);
        const publishedIso = Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
        blogSchema = {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          image: post.image ? [post.image] : undefined,
          thumbnailUrl: post.image || undefined,
          datePublished: publishedIso,
          dateModified: publishedIso,
          mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
          author: {
            '@type': 'Organization',
            name: 'Oneed Research Institute'
          },
          publisher: {
            '@type': 'Organization',
            name: 'Oneed Research Institute',
            logo: {
              '@type': 'ImageObject',
              url: `${SITE_URL}/logo.svg`
            }
          }
        };
      }
    }

    setJsonLdScript('website', websiteSchema);
    setJsonLdScript('faq', faqSchema);
    setJsonLdScript('blog', blogSchema);
  }, [location.pathname]);

  return null;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.userAgent === 'ReactSnap') {
      setAuthReady(true);
      return undefined;
    }

    let mounted = true;

    const bootstrapSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setCurrentUser(data.session?.user || null);
      } catch (_error) {
        if (!mounted) return;
        setCurrentUser(null);
      } finally {
        if (mounted) {
          setAuthReady(true);
        }
      }
    };

    bootstrapSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setCurrentUser(session?.user || null);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignup = async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${SITE_URL}/auth/callback`,
        data: {
          name: name.trim()
        }
      }
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    const needsEmailVerification = !data.session;
    return { ok: true, needsEmailVerification };
  };

  const handleLogin = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen odogwu-bg text-[var(--ink)]">
        <SiteHeader currentUser={null} onLogout={() => {}} />
        <main className="px-6 py-20">
          <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 text-sm text-[var(--muted)]">
            Loading account session...
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen odogwu-bg text-[var(--ink)]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="rounded-3xl bg-white p-8 text-sm text-[var(--muted)]">Loading...</div>
        </div>
      </div>
    }>
      <Routes>
        <Route element={<Layout currentUser={currentUser} onLogout={handleLogout} />}>
          <Route index element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/conferences" element={<ConferencesPage />} />
          <Route path="/grants" element={<GrantsPage />} />
          <Route path="/awards" element={<AwardsPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/login" element={currentUser ? <Navigate to="/account" replace /> : <LoginPage onLogin={handleLogin} />} />
          <Route path="/signup" element={currentUser ? <Navigate to="/account" replace /> : <SignupPage onSignup={handleSignup} />} />
          <Route path="/account" element={currentUser ? <AccountPage currentUser={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
          <Route path="/report-bug" element={<ReportBugPage currentUser={currentUser} />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function Layout({ currentUser, onLogout }) {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 600);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen odogwu-bg text-[var(--ink)]">
      <SeoManager />
      <SiteHeader currentUser={currentUser} onLogout={onLogout} />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
      <ChatWidget />
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-5 left-5 z-40 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--ink)] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 lg:hidden"
        >
          Back to Top
        </button>
      )}
    </div>
  );
}

function SiteHeader({ currentUser, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = useMemo(
    () => [
      {
        label: 'About',
        to: '/about',
        children: [
          { label: 'Mission & Vision', to: '/about#mission' },
          { label: 'Leadership', to: '/about#leadership' },
          { label: 'Why Oneed', to: '/about#why' }
        ]
      },
      {
        label: 'Research',
        to: '/research',
        children: [
          { label: 'Research Centre', to: '/research#centre' },
          { label: 'Impact Projects', to: '/research#projects' },
          { label: 'Research Archive', to: '/research#archive' }
        ]
      },
      {
        label: 'Publications',
        to: '/blog',
        children: [
          { label: 'Oneed Research Journal', to: '/blog' },
          { label: 'Policy Briefs', to: '/blog' },
          { label: 'Resource Library', to: '/blog' }
        ]
      },
      {
        label: 'Conferences',
        to: '/conferences',
        children: [
          { label: 'Upcoming Events', to: '/conferences' },
          { label: 'Past Conferences', to: '/conferences' },
          { label: 'Call for Papers', to: '/contact' }
        ]
      },
      {
        label: 'Grants & Scholarships',
        to: '/grants',
        children: [
          { label: 'Grants & Awards', to: '/grants' },
          { label: 'Scholarship Opportunities', to: '/grants' },
          { label: 'Partner Funding', to: '/contact' }
        ]
      },
      {
        label: 'Membership',
        to: '/contact',
        children: [
          { label: 'Membership Benefits', to: '/contact' },
          { label: 'Join the Network', to: '/contact' },
          { label: 'Institutional Partners', to: '/contact' }
        ]
      },
      {
        label: 'Services',
        to: '/services#courses',
        children: [
          { label: 'Short Courses', to: '/services#courses' },
          { label: 'Workshops & Training', to: '/services#training' },
          { label: 'Professional Development', to: '/services#professional' }
        ]
      },
      {
        label: 'Awards',
        to: '/awards',
        children: [
          { label: 'Recognition Programs', to: '/awards' },
          { label: 'Impact Awards', to: '/awards' },
          { label: 'Nominate a Scholar', to: '/contact' }
        ]
      },
      ...(currentUser
        ? [{ label: 'Account', to: '/account' }]
        : [{ label: 'Log In', to: '/login' }, { label: 'Sign Up', to: '/signup' }])
    ],
    [currentUser]
  );

  const navLinkClass = ({ isActive }) =>
    `text-sm font-semibold transition ${isActive ? 'text-[var(--accent-2)]' : 'text-[var(--ink)] hover:text-[var(--accent-2)]'}`;

  return (
    <header className="border-b border-white/20">
      <div className="bg-[var(--ink)] text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-2 text-xs md:text-sm">
          <div className="flex flex-wrap items-center gap-4 text-white/90">
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> (226) 753-2321
            </span>
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> info@oneedinstitute.ca
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> London, Ontario
            </span>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <div className="hidden items-center gap-2 md:flex">
              <a className="rounded-full border border-white/20 p-2 hover:border-[var(--accent)]" href="https://www.facebook.com/profile.php?id=61586815105340">
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-label="Facebook">
                  <circle cx="12" cy="12" r="12" fill="#1877F2" />
                  <path fill="#ffffff" d="M13.6 20v-7h2.35l.35-2.73H13.6V8.5c0-.79.22-1.33 1.35-1.33h1.44V4.73c-.25-.03-1.1-.1-2.08-.1-2.06 0-3.47 1.26-3.47 3.57v2.07H8.5V13h2.34v7h2.76z" />
                </svg>
              </a>
              <a className="rounded-full border border-white/20 p-2 hover:border-[var(--accent)]" href="https://twitter.com">
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-label="X">
                  <circle cx="12" cy="12" r="12" fill="#0f1419" />
                  <path fill="#ffffff" d="M15.92 5.5h2.08l-4.54 5.19 5.34 7.81h-4.18l-3.27-4.72-4.12 4.72H5.14l4.85-5.56L4.86 5.5h4.28l2.95 4.28 3.83-4.28z" />
                </svg>
              </a>
              <a className="rounded-full border border-white/20 p-2 hover:border-[var(--accent)]" href="https://instagram.com">
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-label="Instagram">
                  <defs>
                    <linearGradient id="igModernHeader" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f9ce34" />
                      <stop offset="45%" stopColor="#ee2a7b" />
                      <stop offset="100%" stopColor="#6228d7" />
                    </linearGradient>
                  </defs>
                  <rect x="1.5" y="1.5" width="21" height="21" rx="6.5" fill="url(#igModernHeader)" />
                  <circle cx="12" cy="12" r="4.2" fill="none" stroke="#ffffff" strokeWidth="1.9" />
                  <circle cx="17.25" cy="6.75" r="1.2" fill="#ffffff" />
                </svg>
              </a>
              <a className="rounded-full border border-white/20 p-2 hover:border-[var(--accent)]" href="https://linkedin.com">
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-label="LinkedIn">
                  <rect x="1" y="1" width="22" height="22" rx="5" fill="#0a66c2" />
                  <rect x="5.15" y="9.1" width="2.4" height="8.2" fill="#ffffff" />
                  <circle cx="6.35" cy="6.75" r="1.2" fill="#ffffff" />
                  <path fill="#ffffff" d="M9.2 9.1h2.3v1.12c.38-.66 1.23-1.28 2.52-1.28 2.24 0 3.23 1.44 3.23 3.93v4.43h-2.4v-3.94c0-1.18-.43-1.99-1.5-1.99-1.15 0-1.75.79-1.75 1.99v3.94H9.2V9.1z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
          <Link to="/" className="flex items-center gap-2 whitespace-nowrap">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-transparent">
              <img src="/logo.svg" alt="Oneed Research Institute logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-sm font-bold tracking-wide">Oneed Institute</span>
          </Link>
          <div className="hidden flex-1 items-center gap-5 lg:flex">
            {navItems.map((item) => (
              <NavLink key={item.label} className={navLinkClass} to={item.to} reloadDocument>
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/contact" reloadDocument className="rounded-full bg-[var(--accent-2)] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 whitespace-nowrap">
              Book Consultation
            </Link>
            {currentUser && (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full border border-[var(--ink)]/30 px-5 py-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-white whitespace-nowrap"
              >
                Log Out
              </button>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <Link
              to="/contact"
              reloadDocument
              className="rounded-full bg-[var(--accent-2)] px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap shadow-md"
            >
              Book a Consultation
            </Link>
            <button
              className="rounded-full border border-[var(--ink)]/20 p-2"
              onClick={() => startTransition(() => setMenuOpen((prev) => !prev))}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-[var(--ink)]/10 bg-white px-6 py-4 lg:hidden">
            <div className="flex flex-col gap-4 text-sm font-semibold">
              {navItems.map((item) => (
                <div key={item.label} className={item.label === 'Sign Up' ? 'mt-4' : ''}>
                  <NavLink
                    className={({ isActive }) => `${navLinkClass({ isActive })} ${item.label === 'Log In' || item.label === 'Sign Up' ? 'block py-2' : ''}`}
                    to={item.to}
                    reloadDocument
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                  {item.children && (
                    <div className="grid gap-2 pl-3 pt-2 text-xs text-[var(--muted)]">
                      {item.children.map((child) => (
                        <Link key={child.label} to={child.to} reloadDocument onClick={() => setMenuOpen(false)}>{child.label}</Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Link to="/contact" reloadDocument className="rounded-full bg-[var(--accent-2)] px-5 py-2 text-center text-sm font-semibold text-white" onClick={() => setMenuOpen(false)}>
                Book Consultation
              </Link>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setMenuOpen(false);
                  }}
                  className="rounded-full border border-[var(--ink)]/30 px-5 py-2 text-sm font-semibold text-[var(--ink)]"
                >
                  Log Out
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

const SiteFooter = memo(function SiteFooter() {
  return (
    <footer className="bg-[var(--ink)] px-6 py-16 text-white/70">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/10">
              <img src="/logo.svg" alt="Oneed Research Institute logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-sm font-bold tracking-wide text-white">Oneed Institute</span>
          </div>
          <p className="mt-4 text-xs leading-relaxed">
            A mission-driven research and education institute committed to inclusive, interdisciplinary, and internationally aligned learning.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Programs</div>
          <div className="mt-3 space-y-2 text-sm">
            <div>Short Courses</div>
            <div>Conferences</div>
            <div>Grants & Scholarships</div>
            <div>Research Journal</div>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Services</div>
          <div className="mt-3 space-y-2 text-sm">
            <div>Short Courses</div>
            <div>Workshops & Training</div>
            <div>Conferences & Seminars</div>
            <div>Professional Development</div>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Company</div>
          <div className="mt-3 space-y-2 text-sm">
            <div>About Us</div>
            <div>Process</div>
            <div>Testimonials</div>
            <div>Contact</div>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Connect</div>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <a className="rounded-full border border-white/20 px-3 py-2 hover:border-[var(--accent)]" href="https://www.facebook.com/profile.php?id=61586815105340">
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-label="Facebook">
                <circle cx="12" cy="12" r="12" fill="#1877F2" />
                <path fill="#ffffff" d="M13.6 20v-7h2.35l.35-2.73H13.6V8.5c0-.79.22-1.33 1.35-1.33h1.44V4.73c-.25-.03-1.1-.1-2.08-.1-2.06 0-3.47 1.26-3.47 3.57v2.07H8.5V13h2.34v7h2.76z" />
              </svg>
            </a>
            <a className="rounded-full border border-white/20 px-3 py-2 hover:border-[var(--accent)]" href="https://instagram.com">
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-label="Instagram">
                <defs>
                  <linearGradient id="igModernFooter" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f9ce34" />
                    <stop offset="45%" stopColor="#ee2a7b" />
                    <stop offset="100%" stopColor="#6228d7" />
                  </linearGradient>
                </defs>
                <rect x="1.5" y="1.5" width="21" height="21" rx="6.5" fill="url(#igModernFooter)" />
                <circle cx="12" cy="12" r="4.2" fill="none" stroke="#ffffff" strokeWidth="1.9" />
                <circle cx="17.25" cy="6.75" r="1.2" fill="#ffffff" />
              </svg>
            </a>
            <a className="rounded-full border border-white/20 px-3 py-2 hover:border-[var(--accent)]" href="https://linkedin.com">
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-label="LinkedIn">
                <rect x="1" y="1" width="22" height="22" rx="5" fill="#0a66c2" />
                <rect x="5.15" y="9.1" width="2.4" height="8.2" fill="#ffffff" />
                <circle cx="6.35" cy="6.75" r="1.2" fill="#ffffff" />
                <path fill="#ffffff" d="M9.2 9.1h2.3v1.12c.38-.66 1.23-1.28 2.52-1.28 2.24 0 3.23 1.44 3.23 3.93v4.43h-2.4v-3.94c0-1.18-.43-1.99-1.5-1.99-1.15 0-1.75.79-1.75 1.99v3.94H9.2V9.1z" />
              </svg>
            </a>
          </div>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="mt-4 rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Return to Top
          </button>
          <Link
            to="/report-bug"
            className="mt-3 inline-flex rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Report a Bug
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl border-t border-white/20 pt-4 text-xs text-white/50">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <span>(c) 2026 Oneed Research Institute. All rights reserved.</span>
            <span className="text-white/30">|</span>
            <span>Empowering Global Education Through Research, Innovation, and Inclusion.</span>
          </div>
          <span className="text-right">Website built by Coral Digital INC</span>
        </div>
      </div>
    </footer>
  );
});

const ChatInput = memo(function ChatInput({ onSend, isLoading }) {
  const inputRef = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    const rawValue = inputRef.current?.value || '';
    const trimmed = rawValue.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-[var(--ink)]/10 bg-white p-3">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask about Oneed services..."
          className="w-full rounded-full border border-[var(--ink)]/20 px-4 py-2 text-sm focus:border-[var(--accent-2)] focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-2)] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
});

const ChatMessages = memo(function ChatMessages({ messages, isLoading, endRef }) {
  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[var(--surface)] px-4 py-4">
      {messages.map((message, index) => (
        <div
          key={`${message.role}-${index}`}
          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
            message.role === 'user'
              ? 'ml-auto bg-[var(--accent-2)] text-white'
              : 'bg-white text-[var(--ink)]'
          }`}
        >
          {message.content}
        </div>
      ))}
      {isLoading && (
        <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm text-[var(--muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Thinking...
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
});

const ChatWidget = memo(function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am the Oneed assistant. Ask me about programs, training, conferences, and partnerships.'
    }
  ]);
  const messagesRef = useRef(messages);
  const inFlightRef = useRef(false);
  const timeoutRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.chatOpen = isOpen ? 'true' : 'false';
    const event = new CustomEvent('oneed-chat-toggle', { detail: { open: isOpen } });
    window.dispatchEvent(event);
  }, [isOpen]);

  const setMessagesSafe = useCallback((updater) => {
    setMessages((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      messagesRef.current = next;
      return next;
    });
  }, []);

  const sendMessage = useCallback(async (trimmed) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    const nextMessages = [...messagesRef.current, { role: 'user', content: trimmed }];
    setMessagesSafe(nextMessages);
    setIsLoading(true);

    try {
      const controller = new AbortController();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
        signal: controller.signal
      });

      if (response.status === 429) {
        setMessagesSafe((prev) => [
          ...prev,
          { role: 'assistant', content: 'You have sent too many messages. Please wait a while before trying again.' }
        ]);
        return;
      }

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      const reply =
        typeof data.reply === 'string' && data.reply.trim()
          ? data.reply.trim()
          : 'I am available to help with Oneed services, admissions, and partnerships.';

      setMessagesSafe((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      setMessagesSafe((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I could not connect right now. Please try again, or contact us at info@oneedinstitute.ca.'
        }
      ]);
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }, [setMessagesSafe]);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-3 flex w-[min(92vw,360px)] max-h-[min(520px,calc(100vh-100px))] flex-col overflow-hidden rounded-3xl border border-[var(--ink)]/10 bg-white shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between bg-[var(--ink)] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="text-sm font-semibold">Oneed Assistant</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ChatMessages messages={messages} isLoading={isLoading} endRef={endRef} />

          <ChatInput onSend={sendMessage} isLoading={isLoading} />
        </div>
      )}

      <button
        type="button"
        onClick={() => startTransition(() => setIsOpen((prev) => !prev))}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-2)] px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-900/30 transition hover:-translate-y-0.5"
      >
        <MessageCircle className="h-4 w-4" />
        Chat with Oneed
      </button>
    </div>
  );
});
