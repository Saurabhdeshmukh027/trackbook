import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        onCancel?.();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const tones = {
    danger: {
      icon: 'var(--accent-danger)',
      panel: 'rgba(201, 75, 75, 0.12)',
      button: 'linear-gradient(135deg, #e17878, var(--accent-danger))',
    },
    warning: {
      icon: 'var(--accent-warning)',
      panel: 'rgba(210, 139, 30, 0.12)',
      button: 'linear-gradient(135deg, #efbb66, #d28b1e)',
    },
    primary: {
      icon: 'var(--accent-primary)',
      panel: 'rgba(231, 111, 81, 0.12)',
      button: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))',
    },
  };

  const tone = tones[variant] || tones.danger;

  return (
    <>
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 80,
          background: 'rgba(54, 43, 36, 0.34)',
          backdropFilter: 'blur(10px)',
        }}
      />

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 81,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div className="premium-card animate-fade-up w-full max-w-md p-7">
          <div
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: tone.panel, color: tone.icon }}
          >
            <AlertTriangle className="h-7 w-7" />
          </div>

          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-main)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {title}
          </h2>
          <p className="mt-3 text-sm leading-6" style={{ color: 'var(--text-soft)' }}>
            {message}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="btn-primary"
              style={{ background: tone.button }}
            >
              {loading && <span className="spinner" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
