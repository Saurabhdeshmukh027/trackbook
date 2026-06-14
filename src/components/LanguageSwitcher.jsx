import React, { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * LanguageSwitcher — Compact, premium-styled dropdown for switching
 * between English, Hindi, and Marathi.
 *
 * Props:
 *   - compact: boolean — show only the globe icon + current lang code (for navbars)
 *   - variant: 'sidebar' | 'page' | 'navbar' — styling variant
 */
export default function LanguageSwitcher({ compact = false, variant = 'sidebar' }) {
  const { language, setLanguage, LANGUAGES } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: compact ? '8px 12px' : '10px 16px',
    borderRadius: '16px',
    border: '1px solid rgba(214, 194, 174, 0.72)',
    background: 'rgba(255, 251, 245, 0.72)',
    color: 'var(--text-main)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: variant === 'page' ? '100%' : 'auto',
  };

  const dropdownStyle = {
    position: 'absolute',
    top: variant === 'navbar' ? '100%' : undefined,
    bottom: variant !== 'navbar' ? '100%' : undefined,
    left: 0,
    right: variant === 'page' ? 0 : undefined,
    marginBottom: variant !== 'navbar' ? '6px' : undefined,
    marginTop: variant === 'navbar' ? '6px' : undefined,
    minWidth: '180px',
    padding: '6px',
    borderRadius: '18px',
    border: '1px solid rgba(214, 194, 174, 0.72)',
    background: '#fffbf5',
    boxShadow: '0 18px 40px rgba(61, 48, 40, 0.12)',
    zIndex: 100,
    animation: 'fadeIn 0.18s ease',
  };

  const optionStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    width: '100%',
    padding: '10px 14px',
    borderRadius: '14px',
    border: 'none',
    background: isActive
      ? 'linear-gradient(135deg, rgba(244, 162, 97, 0.18), rgba(231, 111, 81, 0.12))'
      : 'transparent',
    color: isActive ? 'var(--accent-primary-dark)' : 'var(--text-main)',
    fontSize: '13px',
    fontWeight: isActive ? 700 : 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={buttonStyle}
        id="language-switcher"
        aria-label="Switch language"
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(231, 111, 81, 0.4)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(214, 194, 174, 0.72)'; }}
      >
        <Globe className="h-4 w-4" style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        {compact ? (
          <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {current.code}
          </span>
        ) : (
          <span>{current.nativeLabel}</span>
        )}
      </button>

      {open && (
        <div style={dropdownStyle}>
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => { setLanguage(lang.code); setOpen(false); }}
                style={optionStyle(isActive)}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(244, 162, 97, 0.06)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{lang.nativeLabel}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{lang.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
