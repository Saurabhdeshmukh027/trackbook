import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { translations, LANGUAGES } from '../i18n';

const STORAGE_KEY = 'trackbook-lang';

const LanguageContext = createContext();

/**
 * Resolve a dot-notation key (e.g. "dashboard.totalCustomers") against
 * a nested object. Returns undefined if the path doesn't exist.
 */
function resolve(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && translations[saved]) return saved;
    } catch {
      /* ignore */
    }
    return 'en';
  });

  // Persist to localStorage & update <html lang="">
  const setLanguage = useCallback((code) => {
    if (!translations[code]) return;
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  // Keep <html lang=""> in sync
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  /**
   * Translation function.
   *   t('dashboard.totalCustomers')              → string
   *   t('common.daysLeft', { count: 5 })         → "5 days left"
   */
  const t = useCallback(
    (key, vars) => {
      let value = resolve(translations[language], key);
      // Fallback to English if missing
      if (value === undefined) {
        value = resolve(translations.en, key);
      }
      // Final fallback — return the key itself
      if (value === undefined) return key;

      // Replace {varName} placeholders
      if (vars && typeof value === 'string') {
        Object.entries(vars).forEach(([k, v]) => {
          value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        });
      }
      return value;
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
