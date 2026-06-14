import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('login.enterEmailPassword'));
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success(t('login.welcomeBackToast'));
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-shell">
      <div className="public-shell-inner">
        <div className="public-hero flex flex-col justify-center">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="text-2xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                TrackBook
              </span>
            </div>
            <h1 className="mt-8 text-3xl font-extrabold leading-tight md:text-4xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {t('login.welcomeBack')}
            </h1>
            <p className="mt-4 text-base leading-relaxed opacity-85">
              {t('login.trackDesc')}
            </p>
            <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold opacity-80">
              <span>{t('login.customerMgmt')}</span>
              <span>{t('login.paymentTracking')}</span>
              <span>{t('login.mealPauseFeature')}</span>
            </div>
          </div>
        </div>

        <div className="premium-card flex flex-col justify-center px-8 py-10 md:px-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-main)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {t('login.signIn')}
            </h2>
            <LanguageSwitcher compact variant="navbar" />
          </div>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-soft)' }}>
            {t('login.enterCredentials')}
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="label" htmlFor="login-email">{t('common.email')}</label>
              <input
                id="login-email"
                className="input"
                type="email"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label" htmlFor="login-password">{t('common.password')}</label>
              <div className="relative">
                <input
                  id="login-password"
                  className="input pr-12"
                  type={showPw ? 'text' : 'password'}
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1"
                  onClick={() => setShowPw(!showPw)}
                  tabIndex={-1}
                >
                  {showPw
                    ? <EyeOff className="h-4 w-4" style={{ color: 'var(--text-faint)' }} />
                    : <Eye className="h-4 w-4" style={{ color: 'var(--text-faint)' }} />
                  }
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>
                {t('login.forgotPassword')}
              </Link>
            </div>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : <LogIn className="h-4 w-4" />}
              {loading ? t('login.signingIn') : t('login.signIn')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-soft)' }}>
            {t('login.noAccount')}{' '}
            <Link to="/register" className="font-bold" style={{ color: 'var(--accent-primary)' }}>
              {t('login.registerHere')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
