import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, IndianRupee } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { addPayment, subscribeToCustomer, updateCustomer } from '../supabase/db';
import { buildRenewalData, formatCurrency, formatDate, getCustomerStatus } from '../utils/subscriptionUtils';
import BusinessShell from '../components/BusinessShell';
import MemberAvatar from '../components/MemberAvatar';
import PageHeader from '../components/PageHeader';

export default function RecordPayment() {
  const { id } = useParams();
  const { business } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState('cash');
  const {
    register, handleSubmit, setValue, watch, formState: { errors },
  } = useForm();

  const amountEntered = Number(watch('amount') || 0);

  useEffect(() => {
    if (!business?.id || !id) return undefined;
    return subscribeToCustomer(business.id, id, setCustomer);
  }, [business?.id, id]);

  const totalDue = customer?.amount_due ?? customer?.subscription_amount ?? 0;
  const remainingAfter = Math.max(0, totalDue - amountEntered);
  const fullPayment = amountEntered >= totalDue && totalDue > 0;

  const quickAmounts = useMemo(
    () => [totalDue, Math.round(totalDue / 2), 500, 1000]
      .filter((v, i, a) => v > 0 && a.indexOf(v) === i).slice(0, 4),
    [totalDue],
  );

  const onSubmit = async ({ amount, note }) => {
    const paid = Number(amount);
    if (!paid || paid <= 0) { toast.error(t('recordPayment.enterValidAmount')); return; }

    setLoading(true);
    try {
      await addPayment(business.id, id, {
        amount: paid,
        payment_mode: paymentMode,
        note: note || '',
      });

      const newAmountDue = Math.max(0, totalDue - paid);
      const isFullPayment = newAmountDue <= 0;

      if (isFullPayment) {
        await updateCustomer(business.id, id, buildRenewalData(customer));
        toast.success(t('recordPayment.fullPaymentRecorded'));
      } else {
        await updateCustomer(business.id, id, {
          amount_paid: (customer.amount_paid || 0) + paid,
          amount_due: newAmountDue,
        });
        toast.success(t('recordPayment.partialPaymentRecorded', { amount: formatCurrency(paid) }));
      }

      navigate(`/customers/${id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!customer) {
    return (
      <BusinessShell title={t('recordPayment.title')} subtitle={t('common.loading')}>
        <div className="card flex items-center justify-center py-16">
          <div className="spinner" style={{ color: 'var(--accent-primary)' }} />
        </div>
      </BusinessShell>
    );
  }

  return (
    <BusinessShell title={t('recordPayment.title')} subtitle={t('recordPayment.recordFor', { name: customer.name })}>
      <div className="space-y-6">
        <PageHeader title={t('recordPayment.title')} subtitle={customer.name} />

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Customer Summary */}
          <div className="card">
            <div className="flex items-center gap-4">
              <MemberAvatar photoURL={customer.photo_url} name={customer.name} size={72} rounded="26px" />
              <div>
                <p className="section-title">{t('common.customer')}</p>
                <h2 className="mt-2 text-2xl font-extrabold" style={{ color: 'var(--text-main)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {customer.name}
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-soft)' }}>{t('common.due')} {formatDate(customer.end_date)}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="rounded-[22px] border p-4" style={{ borderColor: 'var(--border-soft)' }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-faint)' }}>{t('recordPayment.totalPlan')}</p>
                <p className="mt-3 text-xl font-extrabold" style={{ color: 'var(--text-main)' }}>{formatCurrency(customer.subscription_amount)}</p>
              </div>
              <div className="rounded-[22px] border p-4" style={{ borderColor: 'var(--border-soft)' }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-faint)' }}>{t('recordPayment.paid')}</p>
                <p className="mt-3 text-xl font-extrabold" style={{ color: 'var(--accent-tertiary)' }}>{formatCurrency(customer.amount_paid)}</p>
              </div>
              <div className="rounded-[22px] border p-4" style={{ borderColor: 'var(--border-soft)' }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-faint)' }}>{t('recordPayment.balance')}</p>
                <p className="mt-3 text-xl font-extrabold" style={{ color: 'var(--accent-danger)' }}>{formatCurrency(totalDue)}</p>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
            <div>
              <p className="section-title">{t('recordPayment.paymentDetails')}</p>
            </div>

            <div>
              <label className="label" htmlFor="payment-amount">{t('recordPayment.amountLabel')}</label>
              <input
                id="payment-amount"
                className={`input text-lg font-bold ${errors.amount ? 'border-red-500' : ''}`}
                type="number" min="1" placeholder={t('recordPayment.maxAmount', { amount: totalDue })}
                {...register('amount', {
                  required: t('recordPayment.enterAmount'),
                  min: { value: 1, message: t('recordPayment.minimumAmount') },
                })}
              />
              {errors.amount && <p className="mt-1 text-xs" style={{ color: 'var(--accent-danger)' }}>{errors.amount.message}</p>}
            </div>

            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <button key={amt} type="button" className="btn-soft"
                  onClick={() => setValue('amount', amt, { shouldValidate: true })}
                  style={amountEntered === amt ? {
                    background: 'linear-gradient(135deg, rgba(244, 162, 97, 0.24), rgba(231, 111, 81, 0.18))',
                    color: 'var(--accent-primary-dark)', border: '1px solid rgba(231, 111, 81, 0.2)',
                  } : undefined}
                >
                  {amt === totalDue ? t('recordPayment.fullBalance') : formatCurrency(amt)}
                </button>
              ))}
            </div>

            <div>
              <label className="label">{t('recordPayment.paymentMode')}</label>
              <div className="flex gap-2">
                {['cash', 'upi', 'bank'].map((mode) => (
                  <button key={mode} type="button"
                    className={paymentMode === mode ? 'btn-soft' : 'btn-ghost'}
                    style={paymentMode === mode ? {
                      background: 'linear-gradient(135deg, rgba(244, 162, 97, 0.24), rgba(231, 111, 81, 0.18))',
                      color: 'var(--accent-primary-dark)', border: '1px solid rgba(231, 111, 81, 0.2)',
                    } : undefined}
                    onClick={() => setPaymentMode(mode)}
                  >
                    {mode === 'cash' ? t('recordPayment.cash') : mode === 'upi' ? t('recordPayment.upi') : t('recordPayment.bank')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="payment-note">{t('recordPayment.noteOptional')}</label>
              <input id="payment-note" className="input" placeholder={t('recordPayment.addNote')} {...register('note')} />
            </div>

            {amountEntered > 0 && (
              <div className="rounded-[22px] border p-4" style={{
                borderColor: fullPayment ? 'rgba(42, 143, 121, 0.32)' : 'rgba(210, 139, 30, 0.34)',
                background: fullPayment ? 'rgba(42, 143, 121, 0.08)' : 'rgba(210, 139, 30, 0.08)',
              }}>
                {fullPayment ? (
                  <div className="flex items-start gap-3 text-sm" style={{ color: 'var(--accent-tertiary)' }}>
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{t('recordPayment.fullPaymentRenew', { date: formatDate(customer.end_date) })}</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 text-sm" style={{ color: 'var(--accent-warning)' }}>
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{t('recordPayment.remainingPending', { amount: formatCurrency(remainingAfter) })}</span>
                  </div>
                )}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : <IndianRupee className="h-4 w-4" />}
              {loading ? t('recordPayment.recording') : t('recordPayment.title')}
            </button>
          </form>
        </section>
      </div>
    </BusinessShell>
  );
}
