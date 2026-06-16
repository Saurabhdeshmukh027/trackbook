import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Phone,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getPaymentsByBusiness, subscribeToCustomers } from '../supabase/db';
import {
  calcDashboardStats,
  calcMonthlyRevenue,
  calcTodayStats,
  formatCurrency,
  formatDate,
  getCustomerStatus,
  toDate,
} from '../utils/subscriptionUtils';
import { CardSkeleton, StatCardSkeleton } from '../components/SkeletonBlock';
import BusinessShell from '../components/BusinessShell';
import MemberAvatar from '../components/MemberAvatar';

export default function Dashboard() {
  const { business } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ expectedThisMonth: 0, collectedThisMonth: 0, remainingThisMonth: 0 });
  const [todayStats, setTodayStats] = useState({ count: 0, total: 0 });
  const [customerCounts, setCustomerCounts] = useState({ total: 0 });
  const [customers, setCustomers] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [loading, setLoading] = useState(true);

  // Customers whose subscription month has expired (end_date passed)
  const expiredCustomers = useMemo(
    () =>
      customers
        .filter((c) => {
          const status = getCustomerStatus(c);
          return status === 'due' || status === 'overdue' || status === 'expired';
        })
        .sort((a, b) => {
          const endA = toDate(a.end_date);
          const endB = toDate(b.end_date);
          return (endA || 0) - (endB || 0);
        }),
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

        const dashboardStats = calcDashboardStats(customerList, payments);
        const revenue = calcMonthlyRevenue(payments, 6);
        const today = calcTodayStats(payments);

        setCustomers(customerList);
        setStats(dashboardStats);
        setTodayStats(today);
        setMonthlyRevenue(revenue);
        setCustomerCounts({ total: customerList.length });
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [business?.id]);

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
        {/* ─── Stat Cards (3 only) ──────────────────────────────────────── */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="stat-card">
              <Users className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
              <p className="mt-4 stat-label">{t('dashboard.totalCustomers')}</p>
              <p className="mt-2 stat-value">{customerCounts.total}</p>
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
          </section>
        )}

        {/* ─── Expired Customers + Revenue Chart ────────────────────────── */}
        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          {loading ? (
            <><CardSkeleton lines={5} /><CardSkeleton lines={5} /></>
          ) : (
            <>
              {/* Expired Customers List */}
              <div className="card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="section-title">{t('dashboard.expiredCustomers') || 'Expired Customers'}</p>
                    <h3 className="mt-2 text-xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-main)' }}>
                      {t('dashboard.monthEnded') || 'Month Ended'}
                    </h3>
                  </div>
                  <button className="btn-ghost" onClick={() => navigate('/customers?filter=expired')}>
                    {t('common.viewAll')} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-6 space-y-3">
                  {expiredCustomers.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed px-5 py-12 text-center" style={{ borderColor: 'var(--border-strong)' }}>
                      <div className="empty-state-icon mx-auto"><CheckCircle2 className="h-8 w-8" /></div>
                      <p className="mt-5 text-lg font-bold" style={{ color: 'var(--text-main)' }}>{t('dashboard.everythingOnTrack')}</p>
                      <p className="mt-2 text-sm" style={{ color: 'var(--text-soft)' }}>{t('dashboard.allSubscriptionsActive') || 'All customer subscriptions are active.'}</p>
                    </div>
                  ) : (
                    expiredCustomers.slice(0, 8).map((customer) => (
                      <div key={customer.id} className="member-row" style={{ alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(`/customers/${customer.id}`)}>
                        <MemberAvatar photoURL={customer.photo_url} name={customer.name} size={48} rounded="18px" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold" style={{ color: 'var(--text-main)' }}>{customer.name}</p>
                          <p className="truncate text-xs" style={{ color: 'var(--text-soft)' }}>
                            {customer.mobile} · Ended {formatDate(customer.end_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: 'var(--accent-primary-dark)' }}>
                            {formatCurrency(customer.amount_due || customer.subscription_amount)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
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
                        </div>
                      </div>
                    ))
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
      </div>
    </BusinessShell>
  );
}
