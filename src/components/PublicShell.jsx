import React from 'react';
import { BookOpen, CheckCircle2 } from 'lucide-react';

export default function PublicShell({
  eyebrow = 'TrackBook',
  title,
  subtitle,
  points = [],
  children,
}) {
  return (
    <div className="public-shell">
      <div className="public-shell-inner">
        <section className="public-hero">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/18">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">{eyebrow}</p>
              <p className="text-2xl font-extrabold md:text-3xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Premium Business Ledger
              </p>
            </div>
          </div>

          <div className="mt-12 max-w-xl">
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {title}
            </h1>
            {subtitle && <p className="mt-4 text-base leading-7 text-white/78 md:text-lg">{subtitle}</p>}
          </div>

          {points.length > 0 && (
            <div className="mt-10 grid gap-3">
              {points.map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-white" />
                  <p className="text-sm leading-6 text-white/86">{point}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="premium-card p-6 md:p-8">{children}</section>
      </div>
    </div>
  );
}
