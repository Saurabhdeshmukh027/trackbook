import React from 'react';
import { BookOpen } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="public-shell">
      <div className="glass-panel flex w-full max-w-md flex-col items-center gap-5 px-8 py-10 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-3xl text-white"
          style={{ background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))' }}
        >
          <BookOpen className="h-8 w-8" />
        </div>
        <div className="spinner" style={{ width: 24, height: 24, color: 'var(--accent-primary)' }} />
        <div>
          <p className="gradient-text text-2xl font-extrabold">TrackBook</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-soft)' }}>
            Loading your business workspace...
          </p>
        </div>
      </div>
    </div>
  );
}
