import React from 'react';
import { BookOpen, Clock, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { openWhatsAppSupport } from '../utils/whatsapp';

export default function PendingApproval() {
  const { logout } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="public-shell">
      <div className="mx-auto w-full max-w-md">
        <div className="premium-card px-8 py-12 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl"
            style={{ background: 'linear-gradient(135deg, rgba(244, 162, 97, 0.18), rgba(231, 111, 81, 0.14))' }}
          >
            <Clock className="h-10 w-10" style={{ color: 'var(--accent-primary)' }} />
          </div>

          <h1
            className="mt-6 text-2xl font-extrabold"
            style={{ color: 'var(--text-main)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {t('pendingApproval.accountUnderReview')}
          </h1>

          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
            {t('pendingApproval.reviewDesc')}
          </p>

          <div
            className="mt-8 rounded-2xl border p-5 text-left"
            style={{ borderColor: 'var(--border-soft)', background: 'rgba(255, 253, 249, 0.8)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
              {t('pendingApproval.whatHappensNext')}
            </p>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: 'var(--text-soft)' }}>
              <li>{t('pendingApproval.step1')}</li>
              <li>{t('pendingApproval.step2')}</li>
              <li>{t('pendingApproval.step3')}</li>
            </ul>
          </div>

          <button
            className="btn-whatsapp mt-6 w-full"
            onClick={openWhatsAppSupport}
          >
            <MessageCircle className="h-4 w-4" />
            {t('pendingApproval.contactSupport')}
          </button>

          <button
            className="btn-ghost mt-4 w-full"
            onClick={logout}
          >
            {t('common.signOut')}
          </button>
        </div>
      </div>
    </div>
  );
}
