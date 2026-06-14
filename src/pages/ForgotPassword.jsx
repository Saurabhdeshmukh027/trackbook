import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error(t('forgotPassword.enterEmail')); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success(t('forgotPassword.resetSent'));
    } catch (error) {
      toast.error(error.message || t('forgotPassword.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-shell">
      <div className="mx-auto w-full max-w-md">
        <div className="premium-card px-8 py-10">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>
            <ArrowLeft className="h-4 w-4" /> {t('forgotPassword.backToLogin')}
          </Link>

          <h1 className="mt-6 text-2xl font-extrabold" style={{ color: 'var(--text-main)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {t('forgotPassword.resetPassword')}
          </h1>

          {sent ? (
            <div className="mt-6 rounded-2xl border p-5 text-center" style={{ borderColor: 'var(--border-soft)', background: 'rgba(42, 143, 121, 0.06)' }}>
              <Mail className="mx-auto h-10 w-10" style={{ color: 'var(--accent-tertiary)' }} />
              <p className="mt-4 text-sm" style={{ color: 'var(--text-soft)' }}>
                {t('forgotPassword.checkEmail')}
              </p>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <p className="text-sm" style={{ color: 'var(--text-soft)' }}>
                {t('forgotPassword.enterEmailDesc')}
              </p>
              <div>
                <label className="label" htmlFor="fp-email">{t('common.email')}</label>
                <input id="fp-email" className="input" type="email" placeholder={t('forgotPassword.emailPlaceholder')}
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : <Mail className="h-4 w-4" />}
                {loading ? t('forgotPassword.sending') : t('forgotPassword.sendResetLink')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
