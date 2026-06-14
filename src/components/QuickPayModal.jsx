import React, { useEffect, useState } from 'react';
import { CheckCircle2, IndianRupee, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { addPayment, updateCustomer } from '../supabase/db';
import { buildRenewalData, formatCurrency, formatDate } from '../utils/subscriptionUtils';
import { useLanguage } from '../context/LanguageContext';

/**
 * QuickPayModal — One-tap "Collect & Renew" modal for due/overdue customers.
 */
export default function QuickPayModal({ isOpen, customer, businessId, onClose, onSuccess }) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [loading, setLoading] = useState(false);

  // Pre-fill full due amount when customer changes or modal opens
  useEffect(() => {
    if (isOpen && customer) {
      const due = customer.amount_due ?? customer.subscription_amount ?? 0;
      setAmount(String(due));
      setPaymentMode('cash');
    }
  }, [isOpen, customer?.id]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !customer) return null;

  const totalDue = customer.amount_due ?? customer.subscription_amount ?? 0;
  const paid = Number(amount) || 0;
  const isFullPayment = paid >= totalDue && totalDue > 0;
  const remaining = Math.max(0, totalDue - paid);

  const quickAmounts = [totalDue, Math.round(totalDue / 2), 500, 1000]
    .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
    .slice(0, 4);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paid || paid <= 0) { toast.error(t('quickPay.enterValidAmount')); return; }

    setLoading(true);
    try {
      // 1. Record the payment
      await addPayment(businessId, customer.id, {
        amount: paid,
        payment_mode: paymentMode,
        note: isFullPayment ? t('quickPay.quickCollectRenew') : t('quickPay.quickPartial'),
      });

      // 2. Update customer — renew if full payment, else update balances
      if (isFullPayment) {
        await updateCustomer(businessId, customer.id, buildRenewalData(customer));
        toast.success(`✅ ${customer.name} — ${formatCurrency(paid)} collected, subscription renewed!`, {
          duration: 4000,
          icon: '🎉',
        });
      } else {
        const newDue = Math.max(0, totalDue - paid);
        await updateCustomer(businessId, customer.id, {
          amount_paid: (customer.amount_paid || 0) + paid,
          amount_due: newDue,
        });
        toast.success(`${customer.name} — ${formatCurrency(paid)} recorded, ${formatCurrency(newDue)} remaining`);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 80,
          background: 'rgba(54, 43, 36, 0.34)',
          backdropFilter: 'blur(10px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 81,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}
      >
        <div className="premium-card animate-fade-up w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-0">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-extrabold"
                style={{ background: 'rgba(42, 143, 121, 0.12)', color: 'var(--accent-tertiary)' }}
              >
                <IndianRupee className="h-5 w-5" />
              </div>
              <div>
                <h2
                  className="text-xl font-extrabold"
                  style={{ color: 'var(--text-main)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {t('quickPay.quickCollect')}
                </h2>
                <p className="mt-0.5 text-sm" style={{ color: 'var(--text-soft)' }}>
                  {customer.name}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              style={{ padding: 8, minWidth: 0 }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Customer Info Strip */}
          <div className="mx-6 mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-[16px] border p-3 text-center" style={{ borderColor: 'var(--border-soft)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{t('quickPay.plan')}</p>
              <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                {formatCurrency(customer.subscription_amount)}
              </p>
            </div>
            <div className="rounded-[16px] border p-3 text-center" style={{ borderColor: 'var(--border-soft)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{t('quickPay.due')}</p>
              <p className="mt-1 text-sm font-bold" style={{ color: 'var(--accent-danger)' }}>
                {formatCurrency(totalDue)}
              </p>
            </div>
            <div className="rounded-[16px] border p-3 text-center" style={{ borderColor: 'var(--border-soft)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{t('quickPay.expired')}</p>
              <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-soft)' }}>
                {formatDate(customer.end_date)}
              </p>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Amount */}
            <div>
              <label className="label" htmlFor="quick-pay-amount">{t('quickPay.amountLabel')}</label>
              <input
                id="quick-pay-amount"
                className="input text-lg font-bold"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('quickPay.fullAmountPlaceholder', { amount: totalDue })}
                autoFocus
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className="btn-soft"
                  onClick={() => setAmount(String(amt))}
                  style={paid === amt ? {
                    background: 'linear-gradient(135deg, rgba(42, 143, 121, 0.20), rgba(42, 143, 121, 0.12))',
                    color: 'var(--accent-tertiary)',
                    border: '1px solid rgba(42, 143, 121, 0.25)',
                  } : undefined}
                >
                  {amt === totalDue ? t('quickPay.fullBalance') : formatCurrency(amt)}
                </button>
              ))}
            </div>

            {/* Payment Mode */}
            <div>
              <label className="label">{t('quickPay.paymentMode')}</label>
              <div className="flex gap-2">
                {['cash', 'upi', 'bank'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={paymentMode === mode ? 'btn-soft' : 'btn-ghost'}
                    style={paymentMode === mode ? {
                      background: 'linear-gradient(135deg, rgba(42, 143, 121, 0.20), rgba(42, 143, 121, 0.12))',
                      color: 'var(--accent-tertiary)',
                      border: '1px solid rgba(42, 143, 121, 0.25)',
                    } : undefined}
                    onClick={() => setPaymentMode(mode)}
                  >
                    {mode === 'cash' ? t('quickPay.cash') : mode === 'upi' ? t('quickPay.upi') : t('quickPay.bank')}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Banner */}
            {paid > 0 && (
              <div
                className="rounded-[18px] border p-4"
                style={{
                  borderColor: isFullPayment ? 'rgba(42, 143, 121, 0.32)' : 'rgba(210, 139, 30, 0.34)',
                  background: isFullPayment ? 'rgba(42, 143, 121, 0.08)' : 'rgba(210, 139, 30, 0.08)',
                }}
              >
                {isFullPayment ? (
                  <div className="flex items-center gap-3 text-sm font-semibold" style={{ color: 'var(--accent-tertiary)' }}>
                    <RefreshCw className="h-4 w-4 flex-shrink-0" />
                    <span>{t('quickPay.fullPaymentRenew')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-sm font-semibold" style={{ color: 'var(--accent-warning)' }}>
                    <IndianRupee className="h-4 w-4 flex-shrink-0" />
                    <span>{t('quickPay.partialPayment', { amount: formatCurrency(remaining) })}</span>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              className="btn-primary w-full"
              type="submit"
              disabled={loading}
              style={isFullPayment ? {
                background: 'linear-gradient(135deg, rgba(42, 143, 121, 0.92), rgba(76, 175, 140, 0.92))',
              } : undefined}
            >
              {loading ? (
                <span className="spinner" />
              ) : isFullPayment ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <IndianRupee className="h-4 w-4" />
              )}
              {loading
                ? t('quickPay.processing')
                : isFullPayment
                  ? t('quickPay.collectAndRenew', { amount: formatCurrency(paid) })
                  : t('quickPay.recordPartial', { amount: formatCurrency(paid) })
              }
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
