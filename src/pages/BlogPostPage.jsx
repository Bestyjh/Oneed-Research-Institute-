import React from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHero from '../components/PageHero';
import blogPosts from '../data/blogPosts.json';

const BLOG_POSTS = blogPosts;

// eslint-disable-next-line no-unused-vars
export default function BlogPostPage() {
  const { slug } = useParams();
  const post = BLOG_POSTS.find((item) => item.slug === slug);

  if (!post) {
    return (
      <>
        <PageHero eyebrow="404" title="We couldn't find that page." description="The page you are looking for doesn't exist or has moved." />
        <section className="px-6 py-20">
          <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 text-center shadow-xl shadow-black/5">
            <h2 className="text-2xl font-semibold">Let us help you get back on track.</h2>
            <p className="mt-4 text-sm text-[var(--muted)]">Visit our services or contact us for a tailored consultation.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/blog" className="rounded-full border border-[var(--ink)] px-6 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-white">
                Back to Blog
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

  return (
    <>
      <PageHero
        eyebrow={post.tag}
        title={post.title}
        description={post.excerpt}
        backgroundImage={post.image}
        breadcrumbLabel={post.title}
        breadcrumbTrail={[{ label: 'Insights', to: '/blog' }]}
      />
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
            <span>{post.date}</span>
            <span className="h-1 w-1 rounded-full bg-[var(--accent-2)]"></span>
            <span>By Oneed Institute</span>
          </div>
          <div className="space-y-8 text-sm text-[var(--muted)]">
            {post.image && (
              <figure className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-black/5">
                <img
                  src={post.image}
                  alt={post.imageAlt || post.title}
                  width={1600}
                  height={900}
                  className="h-[320px] w-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </figure>
            )}
            {post.sections.map((section) => (
              <div key={section.heading} className="rounded-3xl bg-white p-6 shadow-lg shadow-black/5">
                <h3 className="text-xl font-semibold text-[var(--ink)]">{section.heading}</h3>
                <p className="mt-3 leading-relaxed">{section.body}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-[var(--surface)] p-6">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Need support?</div>
              <div className="mt-2 text-lg font-semibold">Talk with a consultant about your case.</div>
            </div>
            <Link to="/contact" className="rounded-full bg-[var(--accent-2)] px-6 py-3 text-sm font-semibold text-white">
              Book Consultation
            </Link>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-lg shadow-black/5">
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">More Posts</div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {BLOG_POSTS.filter((item) => item.slug !== post.slug).slice(0, 2).map((item) => (
                <Link key={item.slug} to={`/blog/${item.slug}`} className="rounded-2xl border border-[var(--ink)]/10 p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="text-xs text-[var(--muted)]">{item.date}</div>
                  <div className="mt-2 text-base font-semibold text-[var(--ink)]">{item.title}</div>
                  <div className="mt-2 text-sm text-[var(--muted)]">{item.excerpt}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
