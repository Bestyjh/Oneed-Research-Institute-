import React from 'react';

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l7 3v5.8c0 4.2-2.6 8-7 10.2-4.4-2.2-7-6-7-10.2V5.5l7-3z" />
    </svg>
  );
}

export default function ShieldedBadge() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--ink)]">
      <ShieldIcon />
    </span>
  );
}
