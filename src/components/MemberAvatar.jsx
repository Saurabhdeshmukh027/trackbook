import React from 'react';

export default function MemberAvatar({ photoURL, name, size = 48, rounded = '22px' }) {
  const initials = name
    ? name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name || 'Member'}
        className="avatar"
        style={{ width: size, height: size, borderRadius: rounded }}
      />
    );
  }

  return (
    <div
      className="avatar flex items-center justify-center text-sm font-extrabold"
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        background: 'linear-gradient(135deg, rgba(244, 162, 97, 0.3), rgba(231, 111, 81, 0.2))',
        color: 'var(--accent-primary-dark)',
      }}
    >
      {initials}
    </div>
  );
}
