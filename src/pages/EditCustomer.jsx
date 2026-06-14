import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getCustomerById, updateCustomer } from '../supabase/db';
import { getMealPlanLabel } from '../utils/subscriptionUtils';
import BusinessShell from '../components/BusinessShell';
import PageHeader from '../components/PageHeader';

export default function EditCustomer() {
  const { id } = useParams();
  const { business } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    if (!business?.id || !id) return;
    (async () => {
      const data = await getCustomerById(business.id, id);
      if (data) {
        setCustomer(data);
        setValue('name', data.name);
        setValue('mobile', data.mobile);
        setValue('address', data.address);
        setValue('subscription_amount', data.subscription_amount);
      }
    })();
  }, [business?.id, id]);

  const onSubmit = async (data) => {
    const mobile = data.mobile?.replace(/\D/g, '');
    if (mobile && (mobile.length !== 10 || !/^[6-9]/.test(mobile))) {
      toast.error(t('addCustomer.invalidMobile'));
      return;
    }

    setLoading(true);
    try {
      await updateCustomer(business.id, id, {
        name: data.name.trim(),
        mobile: mobile || '',
        address: data.address?.trim() || '',
        subscription_amount: Number(data.subscription_amount),
      });
      toast.success(t('editCustomer.customerUpdated'));
      navigate(`/customers/${id}`);
    } catch (error) {
      toast.error(error.message || t('editCustomer.failedToUpdate'));
    } finally {
      setLoading(false);
    }
  };

  if (!customer) {
    return (
      <BusinessShell title={t('editCustomer.title')} subtitle={t('common.loading')}>
        <div className="card flex items-center justify-center py-16">
          <div className="spinner" style={{ color: 'var(--accent-primary)' }} />
        </div>
      </BusinessShell>
    );
  }

  return (
    <BusinessShell title={t('editCustomer.title')} subtitle={customer.name}>
      <div className="space-y-6">
        <PageHeader title={t('editCustomer.title')} subtitle={customer.name} />

        <form className="card space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">{t('common.name')} *</label>
              <input id="name" className={`input ${errors.name ? 'border-red-500' : ''}`}
                {...register('name', { required: t('addCustomer.nameRequired') })} />
            </div>
            <div>
              <label className="label" htmlFor="mobile">{t('common.mobile')}</label>
              <input id="mobile" className="input" type="tel" maxLength={10} {...register('mobile')} />
            </div>
            <div className="md:col-span-2">
              <label className="label" htmlFor="address">{t('common.address')}</label>
              <input id="address" className="input" {...register('address')} />
            </div>
            <div>
              <label className="label" htmlFor="subscription_amount">{t('editCustomer.subscriptionAmount')}</label>
              <input id="subscription_amount" className="input" type="number" min="0"
                {...register('subscription_amount', { min: 0 })} />
            </div>
            <div>
              <label className="label">{t('customers.mealPlan')}</label>
              <div className="input flex items-center" style={{ background: 'rgba(242, 235, 227, 0.5)' }}>
                {getMealPlanLabel(customer.meal_plan)}
                <span className="ml-2 text-xs" style={{ color: 'var(--text-faint)' }}>{t('editCustomer.cannotChange')}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : <Save className="h-4 w-4" />}
              {loading ? t('editCustomer.saving') : t('editCustomer.saveChanges')}
            </button>
            <button className="btn-secondary" type="button" onClick={() => navigate(`/customers/${id}`)}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </BusinessShell>
  );
}
