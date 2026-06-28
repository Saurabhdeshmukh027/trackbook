import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, CreditCard, Edit3, MessageCircle, Package, PauseCircle, Phone, RotateCcw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { subscribeToCustomer, deleteCustomer, getPaymentsByCustomer, getAllMealPauses, addPayment, updateCustomer, getCollectionsByCustomer } from '../supabase/db';
import { formatCurrency, formatDate, getCustomerStatus, getMealPlanLabel, buildQuickRestartData } from '../utils/subscriptionUtils';
import { sendDueReminder, sendPaymentReminder } from '../utils/whatsapp';
import BusinessShell from '../components/BusinessShell';
import MemberAvatar from '../components/MemberAvatar';
import ConfirmModal from '../components/ConfirmModal';
import PageHeader from '../components/PageHeader';

export default function CustomerProfile() {
  const { id } = useParams();
  const { business } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [pauses, setPauses] = useState([]);
  const [collections, setCollections] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isSuspended = business?.status === 'suspended';
  const [renewLoading, setRenewLoading] = useState(false);

  const handleQuickRenew = async () => {
    const confirmMsg = t('customers.confirmQuickRenew', { 
      name: customer.name, 
      amount: formatCurrency(customer.subscription_amount) 
    });

    if (!window.confirm(confirmMsg)) return;

    setRenewLoading(true);
    try {
      await addPayment(business.id, customer.id, {
        amount: customer.subscription_amount || 0,
        payment_mode: 'cash',
        note: 'Quick Restart (One-click)',
      });

      const renewalData = buildQuickRestartData(customer);
      await updateCustomer(business.id, customer.id, renewalData);

      const pay = await getPaymentsByCustomer(business.id, id);
      setPayments(pay);

      const successMsg = t('customers.quickRenewSuccess', { name: customer.name });
      toast.success(`✅ ${successMsg}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setRenewLoading(false);
    }
  };

  const STATUS_STYLES = { active: 'badge-success', due: 'badge-warning', overdue: 'badge-danger', expired: 'badge-muted' };
  const STATUS_LABELS = { active: t('common.active'), due: t('common.due'), overdue: t('common.overdue'), expired: t('common.expired') || 'Expired' };

  useEffect(() => {
    if (!business?.id || !id) return;
    const unsub = subscribeToCustomer(business.id, id, setCustomer);

    (async () => {
      const [pay, pause, cols] = await Promise.all([
        getPaymentsByCustomer(business.id, id),
        getAllMealPauses(business.id, id),
        getCollectionsByCustomer(business.id, id),
      ]);
      setPayments(pay);
      setPauses(pause);
      setCollections(cols);
    })();

    return unsub;
  }, [business?.id, id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCustomer(business.id, id);
      toast.success(t('customerProfile.customerDeleted'));
      navigate('/customers');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (!customer) {
    return (
      <BusinessShell title={t('customerProfile.title')} subtitle={t('common.loading')}>
        <div className="card flex items-center justify-center py-16">
          <div className="spinner" style={{ color: 'var(--accent-primary)' }} />
        </div>
      </BusinessShell>
    );
  }

  const status = getCustomerStatus(customer);

  return (
    <BusinessShell title={customer.name} subtitle={t('customerProfile.title')}>
      <div className="space-y-6">
        <PageHeader title={customer.name} subtitle={t('customerProfile.title')} />

        {/* Customer Details */}
        <section className="card">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-5">
              <MemberAvatar photoURL={customer.photo_url} name={customer.name} size={80} rounded="28px" />
              <div>
                <h2 className="text-2xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-main)' }}>
                  {customer.name}
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-soft)' }}>{customer.mobile}</p>
                {customer.address && <p className="mt-1 text-sm" style={{ color: 'var(--text-faint)' }}>{customer.address}</p>}
                <span className={`mt-3 ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>
              </div>
            </div>

            {!isSuspended && (
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button className="btn-soft" onClick={() => navigate(`/customers/${id}/edit`)}>
                  <Edit3 className="h-4 w-4" /> {t('common.edit')}
                </button>
                {(status === 'expired' || status === 'overdue' || status === 'due') && (
                  <button className="btn-soft" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary-dark)' }} onClick={handleQuickRenew} disabled={renewLoading}>
                    <RotateCcw className={`h-4 w-4 ${renewLoading ? 'animate-spin' : ''}`} /> {t('customers.quickRenew')}
                  </button>
                )}
                <button className="btn-primary" style={{ width: 'auto', flex: 'none' }} onClick={() => navigate(`/customers/${id}/pay`)}>
                  <CreditCard className="h-4 w-4" /> {t('customers.recordPayment')}
                </button>
                <button className="btn-soft" style={{ width: 'auto', flex: 'none' }} onClick={() => navigate(`/customers/${id}/collections`)}>
                  <Package className="h-4 w-4" /> Collections
                </button>
                {customer.mobile && (
                  <a className="btn-soft" href={`tel:${customer.mobile}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Phone className="h-4 w-4" /> {t('customers.call')}
                  </a>
                )}
                <button className="btn-whatsapp" onClick={() => sendPaymentReminder(customer)}>
                  <MessageCircle className="h-4 w-4" /> {t('customers.whatsapp')}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Subscription Details */}
        <section className="card">
          <p className="section-title">{t('customerProfile.subscriptionDetails')}</p>
          <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[18px] border p-4" style={{ borderColor: 'var(--border-soft)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{t('customerProfile.mealPlan')}</p>
              <p className="mt-2 text-lg font-bold" style={{ color: 'var(--text-main)' }}>{getMealPlanLabel(customer.meal_plan)}</p>
            </div>
            <div className="rounded-[18px] border p-4" style={{ borderColor: 'var(--border-soft)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{t('customerProfile.amount')}</p>
              <p className="mt-2 text-lg font-bold" style={{ color: 'var(--text-main)' }}>{formatCurrency(customer.subscription_amount)}</p>
            </div>
            <div className="rounded-[18px] border p-4" style={{ borderColor: 'var(--border-soft)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{t('customerProfile.startDate')}</p>
              <p className="mt-2 text-lg font-bold" style={{ color: 'var(--text-main)' }}>{formatDate(customer.start_date)}</p>
            </div>
            <div className="rounded-[18px] border p-4" style={{ borderColor: 'var(--border-soft)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{t('customerProfile.endDate')}</p>
              <p className="mt-2 text-lg font-bold" style={{ color: status === 'overdue' ? 'var(--accent-danger)' : 'var(--text-main)' }}>
                {formatDate(customer.end_date)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-[18px] border p-4" style={{ borderColor: 'var(--border-soft)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-soft)' }}>{t('customerProfile.amountDue')}</span>
            <span className="text-xl font-extrabold" style={{ color: 'var(--accent-primary-dark)' }}>
              {formatCurrency(customer.amount_due)}
            </span>
          </div>
        </section>

        {/* Payment History */}
        <section className="card">
          <div className="flex items-center justify-between">
            <p className="section-title">{t('customerProfile.paymentHistory')}</p>
            <button className="btn-ghost" onClick={() => navigate(`/customers/${id}/payments`)}>{t('common.viewAll')}</button>
          </div>
          {payments.length === 0 ? (
            <p className="mt-4 text-sm" style={{ color: 'var(--text-soft)' }}>{t('customerProfile.noPayments')}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {payments.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-[16px] border px-4 py-3" style={{ borderColor: 'var(--border-soft)' }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>{formatCurrency(p.amount)}</p>
                    <p className="text-xs" style={{ color: 'var(--text-soft)' }}>{formatDate(p.date)} · {p.payment_mode}</p>
                  </div>
                  {p.note && <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{p.note}</span>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Collections Summary */}
        <section className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="section-title">Collections</p>
              {collections.filter((c) => !c.paid).length > 0 && (
                <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: 'rgba(201, 75, 75, 0.12)', color: 'var(--accent-danger)' }}>
                  {collections.filter((c) => !c.paid).length} pending
                </span>
              )}
            </div>
            <button className="btn-ghost" onClick={() => navigate(`/customers/${id}/collections`)}>
              <Package className="h-4 w-4" /> Manage
            </button>
          </div>

          {/* Pending total banner */}
          {collections.filter((c) => !c.paid).length > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-[16px] border px-4 py-3"
              style={{ borderColor: 'rgba(201, 75, 75, 0.22)', background: 'rgba(201, 75, 75, 0.05)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-soft)' }}>Pending to collect</span>
              <span className="text-lg font-extrabold" style={{ color: 'var(--accent-danger)' }}>
                {formatCurrency(collections.filter((c) => !c.paid).reduce((s, c) => s + Number(c.amount), 0))}
              </span>
            </div>
          )}

          {collections.length === 0 ? (
            <p className="mt-4 text-sm" style={{ color: 'var(--text-soft)' }}>No collections yet. Add parcel or extra meal charges.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {collections.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-[16px] border px-4 py-3"
                  style={{
                    borderColor: c.paid ? 'rgba(42, 143, 121, 0.18)' : 'var(--border-soft)',
                    background: c.paid ? 'rgba(42, 143, 121, 0.04)' : 'transparent',
                  }}>
                  <div className="flex items-center gap-3">
                    <span className="text-base">
                      {c.item === 'Parcel' ? '📦' : c.item === 'Extra Meal' ? '🍛' : c.item === 'Special Item' ? '🛍️' : '✏️'}
                    </span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>{c.item}</p>
                      <p className="text-xs" style={{ color: 'var(--text-soft)' }}>{c.qty} × {formatCurrency(c.rate)} · {formatDate(c.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold" style={{ color: c.paid ? 'var(--accent-tertiary)' : 'var(--text-main)' }}>
                      {formatCurrency(c.amount)}
                    </p>
                    <span className={c.paid ? 'badge-success text-[10px]' : 'badge-warning text-[10px]'}>
                      {c.paid ? 'Collected' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Meal Pause History */}
        <section className="card">
          <div className="flex items-center justify-between">
            <p className="section-title">{t('customerProfile.mealPauseHistory')}</p>
            <button className="btn-ghost" onClick={() => navigate(`/customers/${id}/meal-pause`)}>
              <PauseCircle className="h-4 w-4" /> {t('common.manage')}
            </button>
          </div>
          {pauses.length === 0 ? (
            <p className="mt-4 text-sm" style={{ color: 'var(--text-soft)' }}>{t('customerProfile.noPauses')}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {pauses.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-[16px] border px-4 py-3" style={{ borderColor: 'var(--border-soft)' }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>{formatDate(p.from_date)} — {formatDate(p.to_date)}</p>
                    <p className="text-xs" style={{ color: 'var(--text-soft)' }}>{p.days} {t('common.days')} · {p.reason || t('common.noReason')}</p>
                  </div>
                  <span className={p.settled ? 'badge-success' : 'badge-warning'}>{p.settled ? t('common.settled') : t('common.pending')}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Delete */}
        {!isSuspended && (
          <section>
            <button className="btn-danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" /> {t('customerProfile.deleteCustomer')}
            </button>
          </section>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteOpen}
        title={t('customerProfile.deleteTitle')}
        message={t('customerProfile.deleteMessage', { name: customer.name })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </BusinessShell>
  );
}
