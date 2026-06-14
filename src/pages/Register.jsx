import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const { register: authRegister } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    ownerName: '',
    businessName: '',
    mobile: '',
    email: '',
    password: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validateMobile = (mobile) => {
    const cleaned = mobile.replace(/\D/g, '');
    return cleaned.length === 10 && /^[6-9]/.test(cleaned);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.ownerName.trim()) { toast.error(t('register.enterOwnerName')); return; }
    if (!form.businessName.trim()) { toast.error(t('register.enterBusinessName')); return; }
    if (!validateMobile(form.mobile)) { toast.error(t('register.invalidMobile')); return; }
    if (!form.email.trim()) { toast.error(t('register.enterEmail')); return; }
    if (form.password.length < 6) { toast.error(t('register.passwordMinLength')); return; }

    setLoading(true);
    try {
      await authRegister(form.email, form.password, {
        ownerName: form.ownerName.trim(),
        businessName: form.businessName.trim(),
        mobile: form.mobile.trim(),
      });
      toast.success(t('register.accountCreated'));
      navigate('/pending');
    } catch (error) {
      toast.error(error.message || t('register.registrationFailed'));
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
              {t('register.heroTitle')}
            </h1>
            <p className="mt-4 text-base leading-relaxed opacity-85">
              {t('register.heroDesc')}
            </p>
            <div className="mt-8 space-y-3 text-sm opacity-80">
              <p>{t('register.benefit1')}</p>
              <p>{t('register.benefit2')}</p>
              <p>{t('register.benefit3')}</p>
              <p>{t('register.benefit4')}</p>
            </div>
          </div>
        </div>

        <div className="premium-card flex flex-col justify-center px-8 py-10 md:px-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-main)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {t('register.createAccount')}
            </h2>
            <LanguageSwitcher compact variant="navbar" />
          </div>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-soft)' }}>
            {t('register.fillDetails')}
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="label" htmlFor="reg-owner">{t('register.ownerName')}</label>
              <input
                id="reg-owner"
                className="input"
                type="text"
                placeholder={t('register.ownerPlaceholder')}
                value={form.ownerName}
                onChange={set('ownerName')}
              />
            </div>

            <div>
              <label className="label" htmlFor="reg-business">{t('register.businessName')}</label>
              <input
                id="reg-business"
                className="input"
                type="text"
                placeholder={t('register.businessPlaceholder')}
                value={form.businessName}
                onChange={set('businessName')}
              />
            </div>

            <div>
              <label className="label" htmlFor="reg-mobile">{t('register.mobileNumber')}</label>
              <input
                id="reg-mobile"
                className="input"
                type="tel"
                placeholder={t('register.mobilePlaceholder')}
                value={form.mobile}
                onChange={set('mobile')}
                maxLength={10}
              />
            </div>

            <div>
              <label className="label" htmlFor="reg-email">{t('common.email')}</label>
              <input
                id="reg-email"
                className="input"
                type="email"
                placeholder={t('register.emailPlaceholder')}
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label" htmlFor="reg-password">{t('common.password')}</label>
              <div className="relative">
                <input
                  id="reg-password"
                  className="input pr-12"
                  type={showPw ? 'text' : 'password'}
                  placeholder={t('register.passwordPlaceholder')}
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
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

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : <UserPlus className="h-4 w-4" />}
              {loading ? t('register.creatingAccount') : t('register.createAccount')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-soft)' }}>
            {t('register.alreadyHaveAccount')}{' '}
            <Link to="/login" className="font-bold" style={{ color: 'var(--accent-primary)' }}>
              {t('register.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
