import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getPaymentsByCustomer, getCustomerById } from '../supabase/db';
import { formatCurrency, formatDate } from '../utils/subscriptionUtils';
import BusinessShell from '../components/BusinessShell';

export default function PaymentHistory() {
  const { id } = useParams();
  const { business } = useAuth();
  const { t } = useLanguage();
  const [customer, setCustomer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const MODE_LABELS = { cash: t('paymentHistory.cash'), upi: t('paymentHistory.upi'), bank: t('paymentHistory.bank') };

  useEffect(() => {
    if (!business?.id || !id) return;
    (async () => {
      const [cust, pay] = await Promise.all([
        getCustomerById(business.id, id),
        getPaymentsByCustomer(business.id, id),
      ]);
      setCustomer(cust);
      setPayments(pay);
      setLoading(false);
    })();
  }, [business?.id, id]);

  return (
    <BusinessShell title={t('paymentHistory.title')} subtitle={customer?.name || t('common.loading')}>
      <div className="space-y-6">
        {loading ? (
          <div className="card flex items-center justify-center py-16">
            <div className="spinner" style={{ color: 'var(--accent-primary)' }} />
          </div>
        ) : payments.length === 0 ? (
          <div className="card py-16 text-center">
            <div className="empty-state-icon mx-auto"><CreditCard className="h-8 w-8" /></div>
            <p className="mt-5 text-xl font-bold" style={{ color: 'var(--text-main)' }}>{t('paymentHistory.noPayments')}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>{t('paymentHistory.amount')}</th>
                  <th>{t('paymentHistory.mode')}</th>
                  <th>{t('paymentHistory.date')}</th>
                  <th>{t('paymentHistory.note')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="font-bold" style={{ color: 'var(--accent-tertiary)' }}>{formatCurrency(p.amount)}</td>
                    <td><span className="badge-muted">{MODE_LABELS[p.payment_mode] || p.payment_mode}</span></td>
                    <td>{formatDate(p.date)}</td>
                    <td className="text-sm" style={{ color: 'var(--text-soft)' }}>{p.note || '—'}</td>
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
