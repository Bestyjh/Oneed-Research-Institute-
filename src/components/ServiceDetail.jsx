import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export default function ServiceDetail({ id, title, description, points }) {
  return (
    <div id={id} className="rounded-[32px] bg-white p-8 shadow-xl shadow-black/5 scroll-mt-32">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-[var(--accent-2)]">Service</div>
          <h3 className="mt-3 text-2xl font-semibold">{title}</h3>
          <p className="mt-3 text-sm text-[var(--muted)]">{description}</p>
        </div>
        <Link to="/contact" className="rounded-full border border-[var(--ink)] px-6 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-white">
          Get Started
        </Link>
      </div>
      <div className="mt-6 grid gap-3 text-sm">
        {points.map((item) => (
          <div key={item} className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
            <span>{item}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link to="/contact" className="rounded-full bg-[var(--accent-2)] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5">
          Contact Us
        </Link>
        <Link to="/contact" className="text-xs font-semibold text-[var(--accent-2)] underline-offset-4 transition hover:underline">
          Get Started
        </Link>
      </div>
    </div>
  );
}
