import React, { useEffect, useState } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { CalendarRange, CheckCircle2, Coffee, PauseCircle, PlusCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  addMealPause,
  getCustomerById,
  getUnsettledMealPauses,
  getAllMealPauses,
  settleMealPauses,
  updateCustomer,
} from '../supabase/db';
import { countPauseDays, buildSettleData } from '../utils/mealPauseUtils';
import { formatDate } from '../utils/subscriptionUtils';
import BusinessShell from '../components/BusinessShell';
import ConfirmModal from '../components/ConfirmModal';
import PageHeader from '../components/PageHeader';

export default function MealPauseCustomer() {
  const { id } = useParams();
  const { business } = useAuth();
  const { t } = useLanguage();
  const isSuspended = business?.status === 'suspended';
  const [customer, setCustomer] = useState(null);
  const [unsettled, setUnsettled] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [adding, setAdding] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = async () => {
    if (!business?.id || !id) return;
    const [cust, unsettledData, allData] = await Promise.all([
      getCustomerById(business.id, id),
      getUnsettledMealPauses(business.id, id),
      getAllMealPauses(business.id, id),
    ]);
    if (cust) setCustomer(cust);
    setUnsettled(unsettledData);
    setAllEntries(allData);
    setLoading(false);
  };

  useEffect(() => { load(); }, [business?.id, id]);

  const totalUnsettledDays = countPauseDays(unsettled);

  const onAddPause = async ({ fromDate, toDate, reason }) => {
    setAdding(true);
    try {
      const start = parseISO(fromDate);
      const end = parseISO(toDate);
      if (end < start) { toast.error(t('mealPauseCustomer.endDateAfterStart')); return; }
      const days = differenceInDays(end, start) + 1;

      await addMealPause(business.id, id, {
        from_date: fromDate,
        to_date: toDate,
        days,
        reason: reason?.trim() || '',
      });

      toast.success(t('mealPauseCustomer.daysPaused', { count: days, s: days > 1 ? 's' : '' }));
      reset();
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAdding(false);
    }
  };

  const handleSettle = async () => {
    if (totalUnsettledDays === 0) { toast.error(t('mealPauseCustomer.noUnsettledDays')); return; }
    if (!customer) { toast.error(t('mealPauseCustomer.customerNotLoaded')); return; }

    setSettling(true);
    try {
      await settleMealPauses(business.id, id, unsettled.map(e => e.id), totalUnsettledDays);
      const settleData = buildSettleData(customer, totalUnsettledDays);
      await updateCustomer(business.id, id, settleData);

      toast.success(t('mealPauseCustomer.subscriptionExtended', { count: totalUnsettledDays }));
      await load();
    } catch (error) {
      toast.error(error.message || t('mealPauseCustomer.failedToSettle'));
    } finally {
      setSettling(false);
      setConfirmOpen(false);
    }
  };

  return (
    <BusinessShell title={t('mealPause.title')} subtitle={t('mealPauseCustomer.manageFor', { name: customer?.name || t('common.customer') })}>
      <div className="space-y-6">
        <PageHeader title={t('mealPauseCustomer.title')} subtitle={customer?.name} />

        {loading ? (
          <div className="card flex items-center justify-center py-16">
            <div className="spinner" style={{ color: 'var(--accent-primary)' }} />
          </div>
        ) : (
          <>
            {/* Stats */}
            <section className="grid gap-4 sm:grid-cols-3">
              <div className="stat-card">
                <PauseCircle className="h-5 w-5" style={{ color: 'var(--accent-info)' }} />
                <p className="mt-4 stat-label">{t('mealPauseCustomer.unsettledDays')}</p>
                <p className="mt-2 stat-value">{totalUnsettledDays}</p>
              </div>
              <div className="stat-card">
                <CalendarRange className="h-5 w-5" style={{ color: 'var(--accent-warning)' }} />
                <p className="mt-4 stat-label">{t('mealPauseCustomer.pendingEntries')}</p>
                <p className="mt-2 stat-value" style={{ color: 'var(--accent-warning)' }}>{unsettled.length}</p>
              </div>
              <div className="stat-card">
                <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--accent-tertiary)' }} />
                <p className="mt-4 stat-label">{t('mealPauseCustomer.currentEndDate')}</p>
                <p className="mt-2 text-lg font-bold" style={{ color: 'var(--text-main)' }}>{formatDate(customer.end_date)}</p>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
              <div className="space-y-6">
                {/* Add Pause Form */}
                {!isSuspended && (
                  <div className="card">
                    <div className="flex items-center gap-3">
                      <PlusCircle className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
                      <div>
                        <p className="section-title">{t('mealPauseCustomer.addMealPause')}</p>
                        <h3 className="mt-1 text-xl font-extrabold" style={{ color: 'var(--text-main)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {t('mealPauseCustomer.registerPaused')}
                        </h3>
                      </div>
                    </div>

                    <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onAddPause)}>
                      <div>
                        <label className="label" htmlFor="fromDate">{t('mealPauseCustomer.fromDate')}</label>
                        <input id="fromDate" type="date" className={`input ${errors.fromDate ? 'border-red-500' : ''}`}
                          {...register('fromDate', { required: true })} />
                      </div>
                      <div>
                        <label className="label" htmlFor="toDate">{t('mealPauseCustomer.toDate')}</label>
                        <input id="toDate" type="date" className={`input ${errors.toDate ? 'border-red-500' : ''}`}
                          {...register('toDate', { required: true })} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="label" htmlFor="reason">{t('mealPauseCustomer.reasonOptional')}</label>
                        <input id="reason" className="input" placeholder={t('mealPauseCustomer.reasonPlaceholder')} {...register('reason')} />
                      </div>
                      <div className="md:col-span-2">
                        <button className="btn-primary" type="submit" disabled={adding}>
                          {adding ? <span className="spinner" /> : <PlusCircle className="h-4 w-4" />}
                          {adding ? t('mealPauseCustomer.saving') : t('mealPauseCustomer.addPause')}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Unsettled List */}
                <div className="card">
                  <p className="section-title">{t('mealPauseCustomer.unsettledPauses')}</p>
                  {unsettled.length === 0 ? (
                    <div className="mt-6 rounded-[22px] border border-dashed px-5 py-10 text-center" style={{ borderColor: 'var(--border-strong)' }}>
                      <div className="empty-state-icon mx-auto"><Coffee className="h-8 w-8" /></div>
                      <p className="mt-4 text-lg font-bold" style={{ color: 'var(--text-main)' }}>{t('mealPauseCustomer.noUnsettledPauses')}</p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {unsettled.map((entry) => (
                        <div key={entry.id} className="glass-panel p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold" style={{ color: 'var(--text-main)' }}>
                                {formatDate(entry.from_date)} — {formatDate(entry.to_date)}
                              </p>
                              <p className="mt-1 text-sm" style={{ color: 'var(--text-soft)' }}>
                                {entry.days} {t('common.days')}{entry.reason ? ` · ${entry.reason}` : ''}
                              </p>
                            </div>
                            <span className="badge-warning">{t('common.pending')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Settle Panel */}
              <div className="space-y-6">
                <div className="card">
                  <p className="section-title">{t('mealPauseCustomer.settlePauses')}</p>
                  <h3 className="mt-2 text-xl font-extrabold" style={{ color: 'var(--text-main)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {t('mealPauseCustomer.extendSubscription')}
                  </h3>

                  <div className="mt-6 rounded-[22px] border p-5" style={{ borderColor: 'var(--border-soft)', background: 'rgba(255, 253, 249, 0.84)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-soft)' }}>{t('mealPauseCustomer.currentEndDateLabel')}</p>
                    <p className="mt-2 text-lg font-bold" style={{ color: 'var(--text-main)' }}>{formatDate(customer.end_date)}</p>
                    <p className="mt-4 text-sm" style={{ color: 'var(--text-soft)' }}>
                      {t('mealPauseCustomer.settleExtendInfo', { count: totalUnsettledDays, s: totalUnsettledDays === 1 ? '' : 's' })}
                    </p>
                    {totalUnsettledDays > 0 && (
                      <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--accent-tertiary)' }}>
                        {t('mealPauseCustomer.newEndDate', { date: formatDate(buildSettleData(customer, totalUnsettledDays).end_date) })}
                      </p>
                    )}
                  </div>

                  {!isSuspended && (
                    <button className="btn-primary mt-5" onClick={() => setConfirmOpen(true)}
                      disabled={settling || totalUnsettledDays === 0}>
                      {settling ? <span className="spinner" /> : <CheckCircle2 className="h-4 w-4" />}
                      {t('mealPauseCustomer.settleAndExtend')}
                    </button>
                  )}
                </div>

                {/* Settled History */}
                <div className="card">
                  <p className="section-title">{t('mealPauseCustomer.settledHistory')}</p>
                  <div className="mt-4 space-y-3">
                    {allEntries.filter(e => e.settled).length === 0 ? (
                      <p className="text-sm" style={{ color: 'var(--text-soft)' }}>{t('mealPauseCustomer.noSettledHistory')}</p>
                    ) : (
                      allEntries.filter(e => e.settled).map((entry) => (
                        <div key={entry.id} className="rounded-[16px] border px-4 py-3" style={{ borderColor: 'var(--border-soft)' }}>
                          <p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                            {formatDate(entry.from_date)} — {formatDate(entry.to_date)}
                          </p>
                          <p className="mt-1 text-xs" style={{ color: 'var(--text-soft)' }}>
                            {t('mealPauseCustomer.daysSettled', { count: entry.days, date: formatDate(entry.settled_at) })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title={t('mealPauseCustomer.settleTitle', { count: totalUnsettledDays, s: totalUnsettledDays === 1 ? '' : 's' })}
        message={t('mealPauseCustomer.settleMessage', { count: totalUnsettledDays, s: totalUnsettledDays === 1 ? '' : 's' })}
        confirmLabel={t('mealPauseCustomer.settleAndExtend')}
        variant="primary"
        loading={settling}
        onConfirm={handleSettle}
        onCancel={() => setConfirmOpen(false)}
      />
    </BusinessShell>
  );
}
