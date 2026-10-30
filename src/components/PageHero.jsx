import React from 'react';
import { Link } from 'react-router-dom';

export default function PageHero({
  eyebrow,
  title,
  description,
  backgroundImage,
  popText = false,
  breadcrumbLabel,
  breadcrumbTrail = []
}) {
  const heroStyle = backgroundImage ? { backgroundImage: `url('${backgroundImage}')` } : undefined;
  const breadcrumbText = breadcrumbLabel || eyebrow || title;

  return (
    <section className="relative overflow-hidden px-6 py-20">
      {backgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={heroStyle}
            aria-hidden="true"
          ></div>
          <div className="absolute inset-0 bg-black/45" aria-hidden="true"></div>
        </>
      )}
      <div className={`absolute inset-0 ${backgroundImage ? 'bg-gradient-to-r from-[var(--ink)]/85 via-[var(--ink)]/60 to-[var(--accent-2)]/30' : 'bg-gradient-to-r from-[var(--ink)] via-[var(--ink)]/90 to-[var(--accent-2)]/40'}`}></div>
      <div className="relative mx-auto max-w-6xl text-white">
        {breadcrumbText && (
          <nav aria-label="Breadcrumb" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            <Link to="/" className="transition hover:text-white">
              Home
            </Link>
            {breadcrumbTrail.map((item) => (
              <span key={item.label} className="inline-flex items-center">
                <span className="px-2 text-white/40">/</span>
                {item.to ? (
                  <Link to={item.to} className="transition hover:text-white">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-white/80">{item.label}</span>
                )}
              </span>
            ))}
            <span className="px-2 text-white/40">/</span>
            <span className="text-white/80">{breadcrumbText}</span>
          </nav>
        )}
        <div className={popText ? 'inline-block rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--ink)] shadow-lg shadow-black/30' : 'text-xs uppercase tracking-[0.4em] text-white/70'}>
          {eyebrow}
        </div>
        <h1 className={popText ? 'mt-4 max-w-3xl text-4xl font-semibold leading-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.55)] md:text-6xl' : 'mt-4 text-4xl font-semibold md:text-5xl'}>
          {title}
        </h1>
        <p className={popText ? 'mt-4 max-w-2xl rounded-2xl border border-white/25 bg-black/30 px-5 py-3 text-sm text-white shadow-xl shadow-black/25 backdrop-blur-sm md:text-base' : 'mt-4 max-w-2xl text-sm text-white/80 md:text-base'}>
          {description}
        </p>
      </div>
    </section>
  );
}
