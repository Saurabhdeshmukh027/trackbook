import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  MessageCircle,
  PauseCircle,
  Phone,
  Send,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getPaymentsByBusiness, subscribeToCustomers, getMealPausesByBusiness } from '../supabase/db';
import {
  calcDashboardStats,
  calcMonthlyRevenue,
  calcTodayStats,
  formatCurrency,
  formatDate,
  getDaysOverdue,
  getDaysUntilExpiry,
  getCustomerStatus,
  getExpiringSoon,
  toDate,
} from '../utils/subscriptionUtils';
import { sendDueReminder } from '../utils/whatsapp';
import { CardSkeleton, StatCardSkeleton } from '../components/SkeletonBlock';
import BusinessShell from '../components/BusinessShell';
import QuickPayModal from '../components/QuickPayModal';

export default function Dashboard() {
  const { business } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ expectedThisMonth: 0, collectedThisMonth: 0, remainingThisMonth: 0 });
  const [todayStats, setTodayStats] = useState({ count: 0, total: 0 });
  const [customerCounts, setCustomerCounts] = useState({ total: 0, due: 0, overdue: 0, paused: 0 });
  const [customers, setCustomers] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [payCustomer, setPayCustomer] = useState(null);

  const dueCustomers = useMemo(
    () =>
      customers
        .filter((c) => ['due', 'overdue'].includes(getCustomerStatus(c)))
        .sort((a, b) => getDaysOverdue(b) - getDaysOverdue(a))
        .slice(0, 5),
    [customers],
  );

  const allDueCustomers = useMemo(
    () =>
      customers
        .filter((c) => ['due', 'overdue'].includes(getCustomerStatus(c)))
        .filter((c) => c.mobile),
    [customers],
  );

  const expiringSoon = useMemo(
    () => getExpiringSoon(customers, 7).slice(0, 5),
    [customers],
  );

  const collectionPercent = useMemo(
    () =>
      stats.expectedThisMonth > 0
        ? Math.min(100, Math.round((stats.collectedThisMonth / stats.expectedThisMonth) * 100))
        : 0,
    [stats.expectedThisMonth, stats.collectedThisMonth]
  );

  const maxRevenue = useMemo(
    () => Math.max(1, ...monthlyRevenue.map((e) => e.collected)),
    [monthlyRevenue]
  );

  useEffect(() => {
    if (!business?.id) return undefined;

    const unsubscribe = subscribeToCustomers(business.id, async (customerList) => {
      try {
        const payments = await getPaymentsByBusiness(business.id);
        let pausedCount = 0;
        try {
          const pauses = await getMealPausesByBusiness(business.id);
          const pausedIds = new Set(pauses.map(p => p.customer_id));
          pausedCount = pausedIds.size;
        } catch (e) { /* ignore */ }

        const dashboardStats = calcDashboardStats(customerList, payments);
        const revenue = calcMonthlyRevenue(payments, 6);
        const today = calcTodayStats(payments);
        const due = customerList.filter((c) => getCustomerStatus(c) === 'due').length;
        const overdue = customerList.filter((c) => getCustomerStatus(c) === 'overdue').length;

        setCustomers(customerList);
        setStats(dashboardStats);
        setTodayStats(today);
        setMonthlyRevenue(revenue);
        setCustomerCounts({ total: customerList.length, due, overdue, paused: pausedCount });
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [business?.id]);

  const pendingCollection = useMemo(
    () => customers.reduce((sum, c) => sum + (c.amount_due || 0), 0),
    [customers]
  );

  const handleBulkWhatsApp = useCallback(async () => {
    if (allDueCustomers.length === 0) {
      toast.error(t('dashboard.noDueCustomers'));
      return;
    }
    setSendingBulk(true);
    toast.success(`Opening WhatsApp for ${allDueCustomers.length} customers...`);
    for (let i = 0; i < allDueCustomers.length; i++) {
      sendDueReminder(allDueCustomers[i]);
      // Small delay so browser can open each tab
      if (i < allDueCustomers.length - 1) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }
    setSendingBulk(false);
  }, [allDueCustomers, t]);

  return (
    <BusinessShell
      title={t('nav.dashboard')}
      subtitle={t('dashboard.subtitle', {
        business: business?.business_name || 'TrackBook',
        date: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      })}
      actions={
        <button className="btn-soft hidden md:inline-flex" onClick={() => navigate('/customers/add')}>
          <UserPlus className="h-4 w-4" />
          {t('common.addCustomer')}
        </button>
      }
    >
      <div className="space-y-8">
        {/* ─── Stat Cards ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
            <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="stat-card">
              <Users className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
              <p className="mt-4 stat-label">{t('dashboard.totalCustomers')}</p>
              <p className="mt-2 stat-value">{customerCounts.total}</p>
            </div>

            <div className="stat-card">
              <AlertCircle className="h-5 w-5" style={{ color: 'var(--accent-warning)' }} />
              <p className="mt-4 stat-label">{t('dashboard.dueCustomers')}</p>
              <p className="mt-2 stat-value" style={{ color: 'var(--accent-warning)' }}>{customerCounts.due}</p>
            </div>

            <div className="stat-card">
              <AlertCircle className="h-5 w-5" style={{ color: 'var(--accent-danger)' }} />
              <p className="mt-4 stat-label">{t('dashboard.overdueCustomers')}</p>
              <p className="mt-2 stat-value" style={{ color: 'var(--accent-danger)' }}>{customerCounts.overdue}</p>
            </div>

            <div className="stat-card">
              <CreditCard className="h-5 w-5" style={{ color: 'var(--accent-primary-dark)' }} />
              <p className="mt-4 stat-label">{t('dashboard.pendingCollection')}</p>
              <p className="mt-2 stat-value" style={{ color: 'var(--accent-primary-dark)' }}>{formatCurrency(pendingCollection)}</p>
            </div>

            <div
              className="stat-card"
              style={{ background: 'linear-gradient(135deg, rgba(231, 111, 81, 0.94), rgba(244, 162, 97, 0.94))' }}
            >
              <TrendingUp className="h-5 w-5 text-white" />
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/78">{t('dashboard.thisMonth')}</p>
              <p className="mt-2 text-[2rem] font-extrabold leading-none text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {formatCurrency(stats.collectedThisMonth)}
              </p>
            </div>

            {/* Today's Collection Summary */}
            <div
              className="stat-card"
              style={{ background: 'linear-gradient(135deg, rgba(42, 143, 121, 0.92), rgba(76, 175, 140, 0.92))' }}
            >
              <CheckCircle2 className="h-5 w-5 text-white" />
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/78">{t('dashboard.todaysCollection')}</p>
              <p className="mt-2 text-[2rem] font-extrabold leading-none text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {formatCurrency(todayStats.total)}
              </p>
              <p className="mt-2 text-xs font-semibold text-white/60">
                {t('dashboard.paymentsReceived', { count: todayStats.count, s: todayStats.count !== 1 ? 's' : '' })}
              </p>
            </div>

            <div className="stat-card">
              <PauseCircle className="h-5 w-5" style={{ color: 'var(--accent-info)' }} />
              <p className="mt-4 stat-label">{t('dashboard.pausedCustomers')}</p>
              <p className="mt-2 stat-value" style={{ color: 'var(--accent-info)' }}>{customerCounts.paused}</p>
            </div>

            {/* Expiring Soon Count */}
            <div className="stat-card">
              <Calendar className="h-5 w-5" style={{ color: '#b45309' }} />
              <p className="mt-4 stat-label">{t('dashboard.expiringIn7Days')}</p>
              <p className="mt-2 stat-value" style={{ color: '#b45309' }}>{getExpiringSoon(customers, 7).length}</p>
            </div>
          </section>
        )}

        {/* ─── Quick Actions ───────────────────────────────────────────── */}
        <section className="grid gap-4 sm:grid-cols-3">
          <button className="member-row" onClick={() => navigate('/customers/add')}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(231, 111, 81, 0.12)', color: 'var(--accent-primary)' }}>
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>{t('common.addCustomer')}</p>
              <p className="text-xs" style={{ color: 'var(--text-soft)' }}>{t('dashboard.createSubscription')}</p>
            </div>
          </button>

          <button className="member-row" onClick={() => navigate('/payments')}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(42, 143, 121, 0.12)', color: 'var(--accent-tertiary)' }}>
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>{t('dashboard.recordPayment')}</p>
              <p className="text-xs" style={{ color: 'var(--text-soft)' }}>{t('dashboard.logPayment')}</p>
            </div>
          </button>

          <button className="member-row" onClick={() => navigate('/meal-pause')}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(76, 124, 193, 0.12)', color: 'var(--accent-info)' }}>
              <PauseCircle className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>{t('dashboard.addMealPause')}</p>
              <p className="text-xs" style={{ color: 'var(--text-soft)' }}>{t('dashboard.trackSkippedDays')}</p>
            </div>
          </button>
        </section>

        {/* ─── Due List + Revenue Chart ─────────────────────────────────── */}
        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          {loading ? (
            <><CardSkeleton lines={5} /><CardSkeleton lines={5} /></>
          ) : (
            <>
              {/* Due Customer List */}
              <div className="card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="section-title">{t('dashboard.dueCustomers')}</p>
                    <h3 className="mt-2 text-xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-main)' }}>
                      {t('dashboard.needsAttention')}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {allDueCustomers.length > 0 && (
                      <button
                        className="btn-whatsapp"
                        style={{ padding: '8px 14px', fontSize: '11px', minWidth: 0 }}
                        onClick={handleBulkWhatsApp}
                        disabled={sendingBulk}
                        title={`Send WhatsApp to all ${allDueCustomers.length} due customers`}
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t('dashboard.sendAll', { count: allDueCustomers.length })}</span>
                      </button>
                    )}
                    <button className="btn-ghost" onClick={() => navigate('/customers?filter=overdue')}>
                      {t('common.viewAll')} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {dueCustomers.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed px-5 py-12 text-center" style={{ borderColor: 'var(--border-strong)' }}>
                      <div className="empty-state-icon mx-auto"><AlertCircle className="h-8 w-8" /></div>
                      <p className="mt-5 text-lg font-bold" style={{ color: 'var(--text-main)' }}>{t('dashboard.everythingOnTrack')}</p>
                      <p className="mt-2 text-sm" style={{ color: 'var(--text-soft)' }}>{t('dashboard.noDueCustomers')}</p>
                    </div>
                  ) : (
                    dueCustomers.map((customer) => {
                      const status = getCustomerStatus(customer);
                      return (
                        <div key={customer.id} className="member-row" style={{ alignItems: 'center' }}>
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-extrabold"
                            style={{
                              background: status === 'overdue' ? 'rgba(201, 75, 75, 0.12)' : 'rgba(210, 139, 30, 0.12)',
                              color: status === 'overdue' ? 'var(--accent-danger)' : 'var(--accent-warning)',
                            }}
                          >
                            {customer.name?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/customers/${customer.id}`)}>
                            <p className="truncate text-sm font-bold" style={{ color: 'var(--text-main)' }}>{customer.name}</p>
                            <p className="truncate text-xs" style={{ color: 'var(--text-soft)' }}>
                              {customer.mobile} · {t('common.due')} {formatDate(customer.end_date)}
                              {getDaysOverdue(customer) > 0 && (
                                <span style={{ color: 'var(--accent-danger)', fontWeight: 600 }}> · {t('common.daysOverdue', { count: getDaysOverdue(customer) })}</span>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold" style={{ color: 'var(--accent-primary-dark)' }}>
                              {formatCurrency(customer.amount_due || customer.subscription_amount)}
                            </p>
                          </div>
                          {/* Call + WhatsApp + Collect buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              className="btn-primary"
                              style={{
                                padding: '7px 12px', fontSize: '11px', minWidth: 0, width: 'auto',
                                background: 'linear-gradient(135deg, rgba(42, 143, 121, 0.92), rgba(76, 175, 140, 0.92))',
                              }}
                              onClick={(e) => { e.stopPropagation(); setPayCustomer(customer); }}
                              title="Quick collect & renew"
                            >
                              <IndianRupee className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">{t('dashboard.collect')}</span>
                            </button>
                            {customer.mobile && (
                              <a
                                className="btn-soft"
                                href={`tel:${customer.mobile}`}
                                style={{ padding: '8px', minWidth: 0 }}
                                title={t('customers.call')}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Phone className="h-4 w-4" />
                              </a>
                            )}
                            <button
                              className="btn-whatsapp"
                              style={{ padding: '8px', fontSize: '11px', minWidth: 0 }}
                              onClick={(e) => { e.stopPropagation(); sendDueReminder(customer); }}
                              title="Send WhatsApp reminder"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="card">
                <div>
                  <p className="section-title">{t('dashboard.revenueChart')}</p>
                  <h3 className="mt-2 text-xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-main)' }}>
                    {t('dashboard.monthlyCollection')}
                  </h3>
                  <p className="mt-2 text-sm" style={{ color: 'var(--text-soft)' }}>
                    {t('dashboard.lastMonths', { percent: collectionPercent })}
                  </p>
                </div>

                <div className="mt-8 flex h-52 items-end gap-3">
                  {monthlyRevenue.map((entry) => {
                    const height = Math.max(12, Math.round((entry.collected / maxRevenue) * 100));
                    return (
                      <div key={entry.key} className="flex flex-1 flex-col items-center gap-3">
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-soft)' }}>
                          {entry.collected > 0 ? formatCurrency(entry.collected) : '--'}
                        </span>
                        <div className="flex h-36 w-full items-end rounded-[18px] bg-[rgba(244,162,97,0.08)] p-2">
                          <div
                            className="w-full rounded-[14px]"
                            style={{
                              height: `${height}%`,
                              background:
                                entry.key === new Date().toISOString().slice(0, 7)
                                  ? 'linear-gradient(180deg, var(--accent-secondary), var(--accent-primary))'
                                  : 'linear-gradient(180deg, rgba(244, 162, 97, 0.38), rgba(231, 111, 81, 0.62))',
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--text-faint)' }}>
                          {entry.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>

        {/* ─── Expiring Soon Section ──────────────────────────────── */}
        {!loading && expiringSoon.length > 0 && (
          <section className="card">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: 'rgba(180, 83, 9, 0.10)', color: '#b45309' }}>
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="section-title">{t('dashboard.expiringSoon')}</p>
                  <h3 className="mt-1 text-lg font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-main)' }}>
                    {t('dashboard.subscriptionsEnding')}
                  </h3>
                </div>
              </div>
              <button className="btn-ghost" onClick={() => navigate('/customers?filter=active')}>
                {t('common.viewAll')} <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {expiringSoon.map((customer) => {
                const daysLeft = getDaysUntilExpiry(customer);
                return (
                  <div
                    key={customer.id}
                    className="member-row"
                    style={{ alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-extrabold"
                      style={{ background: 'rgba(180, 83, 9, 0.10)', color: '#b45309' }}
                    >
                      {customer.name?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold" style={{ color: 'var(--text-main)' }}>{customer.name}</p>
                      <p className="truncate text-xs" style={{ color: 'var(--text-soft)' }}>
                        {formatDate(customer.end_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className="rounded-full px-3 py-1 text-xs font-bold"
                        style={{
                          background: daysLeft <= 2 ? 'rgba(201, 75, 75, 0.12)' : 'rgba(180, 83, 9, 0.10)',
                          color: daysLeft <= 2 ? 'var(--accent-danger)' : '#b45309',
                        }}
                      >
                        {daysLeft === 1 ? t('common.tomorrow') : t('common.daysLeft', { count: daysLeft })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {customer.mobile && (
                        <>
                          <a
                            className="btn-soft"
                            href={`tel:${customer.mobile}`}
                            style={{ padding: '7px', minWidth: 0 }}
                            title={t('customers.call')}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                          <button
                            className="btn-soft"
                            style={{ padding: '7px', minWidth: 0 }}
                            onClick={(e) => { e.stopPropagation(); sendDueReminder(customer); }}
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Quick Pay Modal */}
      <QuickPayModal
        isOpen={!!payCustomer}
        customer={payCustomer}
        businessId={business?.id}
        onClose={() => setPayCustomer(null)}
      />
    </BusinessShell>
  );
}
