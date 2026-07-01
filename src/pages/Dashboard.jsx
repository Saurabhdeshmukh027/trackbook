import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  CheckCircle2,
  Phone,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getPaymentsByBusiness, getCollectionsByBusiness, subscribeToCustomers, subscribeToExpenses, addPayment, updateCustomer } from '../supabase/db';
import {
  calcDashboardStats,
  calcMonthlyRevenue,
  calcTodayStats,
  formatCurrency,
  formatDate,
  getCustomerStatus,
  toDate,
  buildQuickRestartData,
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
  const [expenses, setExpenses] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewLoading, setRenewLoading] = useState(null);

  const handleQuickRenew = async (e, customer) => {
    e.stopPropagation();
    
    const confirmMsg = t('customers.confirmQuickRenew', { 
      name: customer.name, 
      amount: formatCurrency(customer.subscription_amount) 
    });

    if (!window.confirm(confirmMsg)) return;

    setRenewLoading(customer.id);
    try {
      await addPayment(business.id, customer.id, {
        amount: customer.subscription_amount || 0,
        payment_mode: 'cash',
        note: 'Quick Restart (One-click)',
      });

      const renewalData = buildQuickRestartData(customer);
      await updateCustomer(business.id, customer.id, renewalData);

      const successMsg = t('customers.quickRenewSuccess', { name: customer.name });
      toast.success(`✅ ${successMsg}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setRenewLoading(null);
    }
  };

  // Calculate current month's total expenses and balance
  const totalExpensesThisMonth = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return expenses
      .filter((exp) => {
        const d = toDate(exp.date);
        return d && d >= startOfMonth && d <= endOfMonth;
      })
      .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  }, [expenses]);

  const totalBalanceThisMonth = useMemo(() => {
    return stats.collectedThisMonth - totalExpensesThisMonth;
  }, [stats.collectedThisMonth, totalExpensesThisMonth]);

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
        const [payments, collections] = await Promise.all([
          getPaymentsByBusiness(business.id),
          getCollectionsByBusiness(business.id),
        ]);

        // Map paid collections to look like payment records for stats calculation
        const paidCollections = collections
          .filter((c) => c.paid)
          .map((c) => ({
            ...c,
            amount: Number(c.amount),
            date: c.paid_at || c.date || c.created_at,
          }));

        // Combine regular tiffin payments with extra collections (parcel, guest meals)
        const allTransactions = [...payments, ...paidCollections];

        const dashboardStats = calcDashboardStats(customerList, allTransactions);
        const revenue = calcMonthlyRevenue(allTransactions, 6);
        const today = calcTodayStats(allTransactions);

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

  useEffect(() => {
    if (!business?.id) return undefined;
    const unsubscribe = subscribeToExpenses(business.id, (data) => {
      setExpenses(data);
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
        <div className="flex gap-2">
          <button className="btn-soft" onClick={() => navigate('/collections')}>
            <Package className="h-4 w-4" />
            {t('nav.collections') || 'Collections'}
          </button>
          <button className="btn-soft hidden sm:inline-flex" onClick={() => navigate('/customers/add')}>
            <UserPlus className="h-4 w-4" />
            {t('common.addCustomer')}
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* ─── Stat Cards ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
          </div>
        ) : (
          <section className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div className="stat-card">
              <Users className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
              <p className="mt-4 stat-label">{t('dashboard.totalCustomers')}</p>
              <p className="mt-2 stat-value">{customerCounts.total}</p>
            </div>

            <div
              className="stat-card"
              style={{ background: 'linear-gradient(135deg, rgba(42, 143, 121, 0.94), rgba(76, 175, 140, 0.94))' }}
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

            <div
              className="stat-card"
              style={{ background: 'linear-gradient(135deg, rgba(201, 75, 75, 0.94), rgba(229, 115, 115, 0.94))', cursor: 'pointer' }}
              onClick={() => navigate('/expenses')}
            >
              <TrendingDown className="h-5 w-5 text-white" />
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/78">{t('dashboard.monthlyExpenses')}</p>
              <p className="mt-2 text-[2rem] font-extrabold leading-none text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {formatCurrency(totalExpensesThisMonth)}
              </p>
            </div>

            <div
              className="stat-card"
              style={{
                background: totalBalanceThisMonth >= 0
                  ? 'linear-gradient(135deg, rgba(42, 143, 121, 0.94), rgba(76, 175, 140, 0.94))'
                  : 'linear-gradient(135deg, rgba(201, 75, 75, 0.94), rgba(229, 115, 115, 0.94))'
              }}
            >
              <Wallet className="h-5 w-5 text-white" />
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/78">{t('dashboard.totalBalance')}</p>
              <p className="mt-2 text-[2rem] font-extrabold leading-none text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {formatCurrency(totalBalanceThisMonth)}
              </p>
            </div>
          </section>
        )}

        {/* ─── Expired Customers + Revenue Chart ────────────────────────── */}
        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
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
                          <button
                            className="btn-soft"
                            style={{ padding: '8px', minWidth: 0, color: 'var(--accent-primary-dark)' }}
                            title={t('customers.quickRenew')}
                            onClick={(e) => handleQuickRenew(e, customer)}
                            disabled={renewLoading === customer.id}
                          >
                            {renewLoading === customer.id ? (
                              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
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

                <div className="mt-8 flex h-44 sm:h-52 items-end gap-2 sm:gap-3">
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
