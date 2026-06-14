import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CreditCard,
  IndianRupee,
  MessageCircle,
  PauseCircle,
  Shield,
  Smartphone,
  Users,
  Zap,
  Check,
  BarChart3,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState(null);

  const FEATURES = [
    { icon: Users, title: t('landing.featureCustomerMgmt'), desc: t('landing.featureCustomerMgmtDesc') },
    { icon: IndianRupee, title: t('landing.featurePaymentRec'), desc: t('landing.featurePaymentRecDesc') },
    { icon: PauseCircle, title: t('landing.featureMealPause'), desc: t('landing.featureMealPauseDesc') },
    { icon: CreditCard, title: t('landing.featureDueAlerts'), desc: t('landing.featureDueAlertsDesc') },
    { icon: MessageCircle, title: t('landing.featureWhatsapp'), desc: t('landing.featureWhatsappDesc') },
    { icon: BarChart3, title: t('landing.featureRevenue'), desc: t('landing.featureRevenueDesc') },
  ];

  const BENEFITS = [
    { emoji: '📓', title: t('landing.benefitNotebooks'), desc: t('landing.benefitNotebooksDesc') },
    { emoji: '💰', title: t('landing.benefitPayments'), desc: t('landing.benefitPaymentsDesc') },
    { emoji: '🍱', title: t('landing.benefitMealPause'), desc: t('landing.benefitMealPauseDesc') },
    { emoji: '📱', title: t('landing.benefitMobile'), desc: t('landing.benefitMobileDesc') },
  ];

  const FAQS = [
    { q: t('landing.faq1q'), a: t('landing.faq1a') },
    { q: t('landing.faq2q'), a: t('landing.faq2a') },
    { q: t('landing.faq3q'), a: t('landing.faq3a') },
    { q: t('landing.faq4q'), a: t('landing.faq4a') },
    { q: t('landing.faq5q'), a: t('landing.faq5a') },
    { q: t('landing.faq6q'), a: t('landing.faq6a') },
  ];

  const PRICING_FEATURES = [
    t('landing.unlimitedCustomers'),
    t('landing.paymentRecording'),
    t('landing.mealPauseTracking'),
    t('landing.whatsappReminders'),
    t('landing.revenueDashboard'),
    t('landing.csvExport'),
  ];

  return (
    <div className="landing-page">
      {/* ─── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="landing-nav">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))' }}
          >
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="gradient-text text-xl font-extrabold">TrackBook</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher compact variant="navbar" />
          <button className="btn-ghost" onClick={() => navigate('/login')}>
            {t('landing.login')}
          </button>
          <button
            className="btn-primary"
            style={{ width: 'auto', minHeight: '40px', padding: '0 20px', fontSize: '13px' }}
            onClick={() => navigate('/register')}
          >
            {t('landing.startFreeTrial')}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-container relative z-10">
          <div
            className="mx-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
            style={{ background: 'rgba(244, 162, 97, 0.12)', color: 'var(--accent-primary-dark)' }}
          >
            <Zap className="h-4 w-4" />
            {t('landing.builtForIndian')}
          </div>
          <h1
            className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-main)' }}
          >
            {t('landing.heroTitle')}{' '}
            <span className="gradient-text">{t('landing.heroTitleHighlight')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed" style={{ color: 'var(--text-soft)' }}>
            {t('landing.heroDesc')}
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              className="btn-primary"
              style={{ width: 'auto', minHeight: '52px', padding: '0 32px', fontSize: '15px', borderRadius: '18px' }}
              onClick={() => navigate('/register')}
            >
              {t('landing.startFreeTrial')}
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              className="btn-soft"
              style={{ minHeight: '52px', padding: '0 24px' }}
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('landing.seeFeatures')}
            </button>
          </div>
          <p className="mt-4 text-sm" style={{ color: 'var(--text-faint)' }}>
            {t('landing.noCreditCard')}
          </p>
        </div>
      </section>

      {/* ─── Benefits ────────────────────────────────────────────────────── */}
      <section className="landing-section-alt">
        <div className="landing-container">
          <div className="text-center">
            <p className="section-title">{t('landing.whyTrackBook')}</p>
            <h2
              className="mt-3 text-3xl font-extrabold md:text-4xl"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-main)' }}
            >
              {t('landing.replaceManual')}
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b, i) => (
              <div key={i} className="landing-feature-card text-center">
                <span className="text-4xl">{b.emoji}</span>
                <h3 className="mt-4 text-lg font-bold" style={{ color: 'var(--text-main)' }}>
                  {b.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="landing-section">
        <div className="landing-container">
          <div className="text-center">
            <p className="section-title">{t('landing.features')}</p>
            <h2
              className="mt-3 text-3xl font-extrabold md:text-4xl"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-main)' }}
            >
              {t('landing.everythingYouNeed')}
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="landing-feature-card">
                <div className="landing-feature-icon">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold" style={{ color: 'var(--text-main)' }}>
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─────────────────────────────────────────────────────── */}
      <section className="landing-section-alt">
        <div className="landing-container">
          <div className="text-center">
            <p className="section-title">{t('landing.pricing')}</p>
            <h2
              className="mt-3 text-3xl font-extrabold md:text-4xl"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-main)' }}
            >
              {t('landing.startFreeGrow')}
            </h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-lg gap-6">
            <div className="landing-pricing-card featured">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>
                  {t('landing.freeTrial')}
                </h3>
                <span className="badge-success">{t('common.active')}</span>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-main)' }}>
                  ₹0
                </span>
                <span className="text-sm" style={{ color: 'var(--text-soft)' }}>{t('landing.perMonth')}</span>
              </div>
              <p className="mt-3 text-sm" style={{ color: 'var(--text-soft)' }}>
                {t('landing.fullAccess')}
              </p>
              <ul className="mt-6 space-y-3">
                {PRICING_FEATURES.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-main)' }}>
                    <Check className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--accent-tertiary)' }} />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                className="btn-primary mt-8"
                onClick={() => navigate('/register')}
              >
                {t('landing.startFreeTrial')}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="text-center">
            <p className="section-title">{t('landing.faq')}</p>
            <h2
              className="mt-3 text-3xl font-extrabold md:text-4xl"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-main)' }}
            >
              {t('landing.commonQuestions')}
            </h2>
          </div>
          <div className="mx-auto mt-12 max-w-2xl space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="landing-faq-item">
                <button
                  className="landing-faq-trigger"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className="h-5 w-5 flex-shrink-0 transition-transform"
                    style={{
                      color: 'var(--text-faint)',
                      transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>
                {openFaq === i && (
                  <div className="landing-faq-content animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────── */}
      <section className="landing-section-alt">
        <div className="landing-container text-center">
          <div
            className="mx-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
            style={{ background: 'rgba(42, 143, 121, 0.12)', color: 'var(--accent-tertiary)' }}
          >
            <Smartphone className="h-4 w-4" />
            {t('landing.worksOnMobile')}
          </div>
          <h2
            className="mt-6 text-3xl font-extrabold md:text-4xl"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-main)' }}
          >
            {t('landing.readyToDigitize')}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base" style={{ color: 'var(--text-soft)' }}>
            {t('landing.joinOwners')}
          </p>
          <button
            className="btn-primary mx-auto mt-8"
            style={{ width: 'auto', minHeight: '52px', padding: '0 36px', fontSize: '15px', borderRadius: '18px' }}
            onClick={() => navigate('/register')}
          >
            {t('landing.startFreeNoCc')}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="flex items-center justify-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
              style={{ background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))' }}
            >
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="gradient-text text-lg font-bold">TrackBook</span>
          </div>
          <p className="mt-4 text-sm" style={{ color: 'var(--text-faint)' }}>
            {t('landing.footerDesc')}
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm" style={{ color: 'var(--text-soft)' }}>
            <button className="btn-ghost" onClick={() => navigate('/login')}>{t('landing.login')}</button>
            <span>·</span>
            <button className="btn-ghost" onClick={() => navigate('/register')}>{t('landing.register')}</button>
          </div>
          <p className="mt-6 text-xs" style={{ color: 'var(--text-faint)' }}>
            {t('landing.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  );
}
