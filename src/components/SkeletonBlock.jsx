import React from 'react';

export default function SkeletonBlock({ className = '', width, height, style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width ?? '100%',
        height: height ?? 16,
        borderRadius: 10,
        ...style,
      }}
    />
  );
}

export function MemberRowSkeleton() {
  return (
    <div className="member-row" style={{ pointerEvents: 'none' }}>
      <SkeletonBlock width={54} height={54} style={{ borderRadius: 18, flexShrink: 0 }} />
      <div className="flex-1 space-y-2">
        <SkeletonBlock width="52%" height={14} />
        <SkeletonBlock width="34%" height={12} />
      </div>
      <SkeletonBlock width={76} height={24} style={{ borderRadius: 999 }} />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <SkeletonBlock width={36} height={36} style={{ borderRadius: 14, marginBottom: 12 }} />
      <SkeletonBlock width="40%" height={32} style={{ marginBottom: 8 }} />
      <SkeletonBlock width="64%" height={12} />
    </div>
  );
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="card space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBlock
          key={index}
          width={index === 0 ? '34%' : index % 2 === 0 ? '82%' : '65%'}
          height={index === 0 ? 14 : 16}
        />
      ))}
    </div>
  );
}
