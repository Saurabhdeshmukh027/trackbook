import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PauseCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getMealPausesByBusiness } from '../supabase/db';
import { formatDate } from '../utils/subscriptionUtils';
import BusinessShell from '../components/BusinessShell';

export default function MealPause() {
  const { business } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [pauses, setPauses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business?.id) return;
    (async () => {
      const data = await getMealPausesByBusiness(business.id);
      setPauses(data);
      setLoading(false);
    })();
  }, [business?.id]);

  return (
    <BusinessShell title={t('mealPause.title')} subtitle={t('mealPause.subtitle')}>
      <div className="space-y-6">
        <div className="card">
          <p className="section-title">{t('mealPause.overview')}</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-soft)' }}>
            {t('mealPause.description')}
          </p>
        </div>

        {loading ? (
          <div className="card flex items-center justify-center py-16">
            <div className="spinner" style={{ color: 'var(--accent-primary)' }} />
          </div>
        ) : pauses.length === 0 ? (
          <div className="card py-16 text-center">
            <div className="empty-state-icon mx-auto"><PauseCircle className="h-8 w-8" /></div>
            <p className="mt-5 text-xl font-bold" style={{ color: 'var(--text-main)' }}>{t('mealPause.noUnsettled')}</p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-soft)' }}>
              {t('mealPause.allSettled')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pauses.map((p) => (
              <button
                key={p.id}
                className="member-row w-full"
                onClick={() => navigate(`/customers/${p.customer_id}/meal-pause`)}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-extrabold"
                  style={{ background: 'rgba(76, 124, 193, 0.12)', color: 'var(--accent-info)' }}
                >
                  {p.customers?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                    {p.customers?.name || 'Unknown'}
                  </p>
                  <p className="truncate text-xs" style={{ color: 'var(--text-soft)' }}>
                    {formatDate(p.from_date)} — {formatDate(p.to_date)} · {p.days} {t('common.days')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="badge-warning">{t('common.pending')}</span>
                  {p.reason && (
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-faint)' }}>{p.reason}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </BusinessShell>
  );
}
