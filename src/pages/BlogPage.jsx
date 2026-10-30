import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PageHero from '../components/PageHero';
import blogPosts from '../data/blogPosts.json';

const BLOG_POSTS = blogPosts;

// eslint-disable-next-line no-unused-vars
export default function BlogPage() {
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(BLOG_POSTS.map((post) => post.tag)))],
    []
  );
  const [activeCategory, setActiveCategory] = useState('All');
  const filteredPosts = useMemo(
    () => BLOG_POSTS.filter((post) => activeCategory === 'All' || post.tag === activeCategory),
    [activeCategory]
  );

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Insights, updates, and learning resources."
        description="Stay informed with research-driven education and training highlights."
        backgroundImage="https://images.pexels.com/photos/1290141/pexels-photo-1290141.jpeg?cs=srgb&dl=pexels-element5-1290141.jpg&fm=jpg"
        popText
        breadcrumbLabel="Insights"
      />
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs uppercase tracking-[0.4em] text-[var(--accent-2)]">Browse Topics</div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                    activeCategory === category
                      ? 'bg-[var(--accent-2)] text-white'
                      : 'bg-white text-[var(--muted)] border border-[var(--ink)]/10 hover:border-[var(--accent-2)]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <div key={post.title} className="rounded-3xl bg-white p-6 shadow-xl shadow-black/5">
                {post.image && (
                  <img
                    src={post.image}
                    alt={post.imageAlt || post.title}
                    width={1600}
                    height={900}
                    className="h-44 w-full rounded-2xl object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>{post.date}</span>
                  <span className="rounded-full bg-[var(--accent)]/20 px-3 py-1 text-[var(--ink)]">{post.tag}</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold">{post.title}</h3>
                <p className="mt-3 text-sm text-[var(--muted)]">{post.excerpt}</p>
                <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-2)]" to={`/blog/${post.slug}`}>
                  Read More <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
