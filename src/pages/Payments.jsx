import React, { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getPaymentsByBusiness } from '../supabase/db';
import { formatCurrency, formatDate } from '../utils/subscriptionUtils';
import BusinessShell from '../components/BusinessShell';
import { CardSkeleton } from '../components/SkeletonBlock';

export default function Payments() {
  const { business } = useAuth();
  const { t } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business?.id) return;
    (async () => {
      const data = await getPaymentsByBusiness(business.id);
      setPayments(data);
      setLoading(false);
    })();
  }, [business?.id]);

  return (
    <BusinessShell title={t('payments.title')} subtitle={t('payments.subtitle')}>
      <div className="space-y-6">
        <div className="card">
          <p className="section-title">{t('payments.paymentRecords')}</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-soft)' }}>
            {t('payments.selectCustomer')}
          </p>
        </div>

        {loading ? (
          <CardSkeleton lines={8} />
        ) : payments.length === 0 ? (
          <div className="card py-16 text-center">
            <div className="empty-state-icon mx-auto"><CreditCard className="h-8 w-8" /></div>
            <p className="mt-5 text-xl font-bold" style={{ color: 'var(--text-main)' }}>{t('payments.noPayments')}</p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-soft)' }}>{t('payments.paymentsWillAppear')}</p>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[600px] table-auto text-left">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-faint)' }}>
                  <th className="py-3 pr-4">{t('payments.customer')}</th>
                  <th className="py-3 pr-4">{t('payments.amount')}</th>
                  <th className="py-3 pr-4">{t('payments.mode')}</th>
                  <th className="py-3 pr-4">{t('payments.date')}</th>
                  <th className="py-3">{t('payments.note')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t text-sm" style={{ borderColor: 'var(--border-soft)' }}>
                    <td className="py-3 pr-4 font-semibold" style={{ color: 'var(--text-main)' }}>
                      {p.customers?.name || '—'}
                    </td>
                    <td className="py-3 pr-4 font-bold" style={{ color: 'var(--accent-tertiary)' }}>
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full px-3 py-1 text-xs font-bold uppercase"
                        style={{ background: 'rgba(244, 162, 97, 0.12)', color: 'var(--accent-primary-dark)' }}>
                        {p.payment_mode}
                      </span>
                    </td>
                    <td className="py-3 pr-4" style={{ color: 'var(--text-soft)' }}>
                      {formatDate(p.date || p.created_at)}
                    </td>
                    <td className="py-3" style={{ color: 'var(--text-faint)' }}>{p.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </BusinessShell>
  );
}
