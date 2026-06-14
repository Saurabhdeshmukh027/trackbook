import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { addCustomer, Timestamp } from '../supabase/db';
import { calcEndDate, getMealPlanDuration } from '../utils/subscriptionUtils';
import BusinessShell from '../components/BusinessShell';
import PageHeader from '../components/PageHeader';

export default function AddCustomer() {
  const { business } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState('monthly');
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { customDays: 30 },
  });

  const totalAmount = Number(watch('subscriptionAmount') || 0);
  const initialPaid = Number(watch('initialPaid') || 0);

  const onSubmit = async (data) => {
    const mobile = data.mobile?.replace(/\D/g, '');
    if (mobile && (mobile.length !== 10 || !/^[6-9]/.test(mobile))) {
      toast.error(t('addCustomer.invalidMobile'));
      return;
    }

    setLoading(true);
    try {
      const duration = getMealPlanDuration(mealPlan, Number(data.customDays || 30));
      const startDate = new Date(data.startDate);
      const endDate = calcEndDate(startDate, duration);
      const amountDue = Math.max(0, Number(data.subscriptionAmount) - Number(data.initialPaid || 0));

      const result = await addCustomer(business.id, {
        name: data.name.trim(),
        mobile: mobile || '',
        address: data.address?.trim() || '',
        meal_plan: mealPlan,
        subscription_amount: Number(data.subscriptionAmount),
        subscription_duration: duration,
        start_date: Timestamp.fromDate(startDate),
        end_date: Timestamp.fromDate(endDate),
        amount_paid: Number(data.initialPaid || 0),
        amount_due: amountDue,
      });

      toast.success(t('addCustomer.customerAdded'));
      navigate(`/customers/${result.id}`);
    } catch (error) {
      toast.error(error.message || t('addCustomer.failedToAdd'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <BusinessShell title={t('addCustomer.title')} subtitle={t('addCustomer.subtitle')}>
      <div className="space-y-6">
        <PageHeader title={t('addCustomer.title')} subtitle={t('addCustomer.fillDetails')} />

        <form className="card space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Basic Info */}
          <div>
            <p className="section-title">{t('addCustomer.basicInfo')}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="name">{t('common.name')} *</label>
                <input id="name" className={`input ${errors.name ? 'border-red-500' : ''}`}
                  placeholder={t('addCustomer.namePlaceholder')} {...register('name', { required: t('addCustomer.nameRequired') })} />
                {errors.name && <p className="mt-1 text-xs" style={{ color: 'var(--accent-danger)' }}>{errors.name.message}</p>}
              </div>
              <div>
                <label className="label" htmlFor="mobile">{t('common.mobile')}</label>
                <input id="mobile" className="input" type="tel" placeholder={t('addCustomer.mobilePlaceholder')} maxLength={10}
                  {...register('mobile')} />
              </div>
              <div className="md:col-span-2">
                <label className="label" htmlFor="address">{t('common.address')}</label>
                <input id="address" className="input" placeholder={t('addCustomer.addressPlaceholder')} {...register('address')} />
              </div>
            </div>
          </div>

          {/* Meal Plan */}
          <div>
            <p className="section-title">{t('addCustomer.mealPlanSection')}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {['monthly', 'quarterly', 'custom'].map((plan) => (
                <button
                  key={plan}
                  type="button"
                  className={mealPlan === plan ? 'btn-soft' : 'btn-ghost'}
                  style={mealPlan === plan ? {
                    background: 'linear-gradient(135deg, rgba(244, 162, 97, 0.24), rgba(231, 111, 81, 0.18))',
                    color: 'var(--accent-primary-dark)', border: '1px solid rgba(231, 111, 81, 0.2)',
                  } : undefined}
                  onClick={() => setMealPlan(plan)}
                >
                  {plan === 'monthly' ? t('addCustomer.monthly') : plan === 'quarterly' ? t('addCustomer.quarterly') : t('addCustomer.custom')}
                </button>
              ))}
            </div>
            {mealPlan === 'custom' && (
              <div className="mt-4 max-w-[200px]">
                <label className="label" htmlFor="customDays">{t('addCustomer.durationDays')}</label>
                <input id="customDays" className="input" type="number" min="1" max="365"
                  {...register('customDays', { min: 1 })} />
              </div>
            )}
          </div>

          {/* Subscription */}
          <div>
            <p className="section-title">{t('addCustomer.subscription')}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="startDate">{t('addCustomer.startDate')} *</label>
                <input id="startDate" className={`input ${errors.startDate ? 'border-red-500' : ''}`}
                  type="date" defaultValue={new Date().toISOString().slice(0, 10)}
                  {...register('startDate', { required: t('addCustomer.startDateRequired') })} />
              </div>
              <div>
                <label className="label" htmlFor="subscriptionAmount">{t('addCustomer.totalAmount')} *</label>
                <input id="subscriptionAmount" className={`input ${errors.subscriptionAmount ? 'border-red-500' : ''}`}
                  type="number" min="0" placeholder={t('addCustomer.amountPlaceholder')}
                  {...register('subscriptionAmount', { required: t('addCustomer.amountRequired'), min: { value: 0, message: t('addCustomer.cannotBeNegative') } })} />
                {errors.subscriptionAmount && <p className="mt-1 text-xs" style={{ color: 'var(--accent-danger)' }}>{errors.subscriptionAmount.message}</p>}
              </div>
            </div>
          </div>

          {/* Payment */}
          <div>
            <p className="section-title">{t('addCustomer.initialPayment')}</p>
            <div className="mt-4 max-w-[300px]">
              <label className="label" htmlFor="initialPaid">{t('addCustomer.amountPaid')}</label>
              <input id="initialPaid" className="input" type="number" min="0" placeholder="0"
                {...register('initialPaid', { min: { value: 0, message: t('addCustomer.cannotBeNegative') } })} />
            </div>
            {totalAmount > 0 && (
              <div className="mt-3 rounded-[18px] border p-4" style={{ borderColor: 'var(--border-soft)', background: 'rgba(255, 253, 249, 0.8)' }}>
                <p className="text-sm" style={{ color: 'var(--text-soft)' }}>
                  {t('addCustomer.amountDue')} <strong style={{ color: 'var(--accent-primary-dark)' }}>₹{Math.max(0, totalAmount - initialPaid).toLocaleString('en-IN')}</strong>
                </p>
              </div>
            )}
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : <UserPlus className="h-4 w-4" />}
            {loading ? t('addCustomer.adding') : t('addCustomer.title')}
          </button>
        </form>
      </div>
    </BusinessShell>
  );
}
