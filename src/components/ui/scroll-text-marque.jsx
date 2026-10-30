import React from 'react';

export default function ScrollBaseAnimation({
  children,
  baseVelocity = 3,
  delay = 0,
  className = '',
  clasname = ''
}) {
  const speed = Math.max(6, Math.round(36 / Math.max(0.5, Math.abs(baseVelocity))));
  const directionClass = baseVelocity < 0 ? 'scroll-marquee-track-reverse' : 'scroll-marquee-track-forward';
  const mergedClass = className || clasname;

  return (
    <div className="scroll-marquee" style={{ animationDelay: `${delay}ms` }}>
      <div
        className={`scroll-marquee-track ${directionClass}`}
        style={{ animationDuration: `${speed}s` }}
      >
        <span className={`scroll-marquee-item ${mergedClass}`}>{children}</span>
        <span className={`scroll-marquee-item ${mergedClass}`} aria-hidden="true">
          {children}
        </span>
      </div>
    </div>
  );
}

