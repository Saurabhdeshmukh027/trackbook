import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, CreditCard, Download, Edit3, MessageCircle, Phone, Search, UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { subscribeToCustomers } from '../supabase/db';
import { formatCurrency, formatDate, getCustomerStatus, getMealPlanLabel } from '../utils/subscriptionUtils';
import { sendPaymentReminder } from '../utils/whatsapp';
import BusinessShell from '../components/BusinessShell';
import MemberAvatar from '../components/MemberAvatar';
import { MemberRowSkeleton } from '../components/SkeletonBlock';

const FILTERS = ['all', 'active', 'expired'];

const STATUS_STYLES = { active: 'badge-success', due: 'badge-warning', overdue: 'badge-danger', expired: 'badge-muted' };

export default function Customers() {
  const { business } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all');
  const [loading, setLoading] = useState(true);
  const isSuspended = business?.status === 'suspended';

  const FILTER_LABELS = {
    all: t('common.all'),
    active: t('common.active'),
    expired: t('common.expired') || 'Expired',
  };

  useEffect(() => {
    if (searchParams.get('search')) {
      setTimeout(() => document.getElementById('customer-search')?.focus(), 100);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!business?.id) return undefined;
    const unsubscribe = subscribeToCustomers(business.id, (data) => {
      setCustomers(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [business?.id]);

  const counts = useMemo(() => {
    const expiredCount = customers.filter((c) => {
      const s = getCustomerStatus(c);
      return s === 'due' || s === 'overdue' || s === 'expired';
    }).length;
    return {
      all: customers.length,
      active: customers.filter((c) => getCustomerStatus(c) === 'active').length,
      expired: expiredCount,
    };
  }, [customers]);

  const filtered = useMemo(() => {
    let result = customers.filter((c) => {
      if (filter === 'expired') {
        const s = getCustomerStatus(c);
        if (s !== 'due' && s !== 'overdue' && s !== 'expired') return false;
      } else if (filter !== 'all' && getCustomerStatus(c) !== filter) return false;
      if (!query.trim()) return true;
      const val = query.toLowerCase();
      return c.name?.toLowerCase().includes(val) || c.mobile?.includes(query);
    });
    result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return result;
  }, [filter, customers, query]);

  const handleExport = () => {
    if (customers.length === 0) { toast.error(t('settings.noDataToExport')); return; }
    const headers = ['Name', 'Mobile', 'Status', 'Meal Plan', 'Amount', 'Start Date', 'End Date', 'Amount Due'];
    const rows = customers.map((c) => [
      c.name || '', c.mobile || '', getCustomerStatus(c), getMealPlanLabel(c.meal_plan),
      c.subscription_amount || 0, formatDate(c.start_date), formatDate(c.end_date), c.amount_due || 0,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trackbook-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('settings.exportedRecords', { count: customers.length }));
  };

  return (
    <BusinessShell
      title={t('customers.title')}
      subtitle={t('customers.manageRecords', { count: counts.all })}
      actions={
        <div className="flex items-center gap-2">
          <button className="btn-soft hidden md:inline-flex" onClick={handleExport}>
            <Download className="h-4 w-4" /> {t('customers.exportCsv')}
          </button>
          {!isSuspended && (
            <button className="btn-primary hidden md:inline-flex md:w-auto" onClick={() => navigate('/customers/add')}>
              <UserPlus className="h-4 w-4" /> {t('common.addCustomer')}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Search + Filters */}
        <section className="card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
              <input
                id="customer-search"
                className="input pl-11 pr-10"
                placeholder={t('customers.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1" onClick={() => setQuery('')}>
                  <X className="h-4 w-4" style={{ color: 'var(--text-faint)' }} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTERS.map((status) => {
                const active = filter === status;
                return (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={active ? 'btn-soft' : 'btn-ghost'}
                    style={active ? {
                      background: 'linear-gradient(135deg, rgba(244, 162, 97, 0.24), rgba(231, 111, 81, 0.18))',
                      color: 'var(--accent-primary-dark)', border: '1px solid rgba(231, 111, 81, 0.18)',
                    } : undefined}
                  >
                    {FILTER_LABELS[status]} ({counts[status]})
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Customer Grid */}
        <section>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <MemberRowSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card py-16 text-center">
              <div className="empty-state-icon mx-auto"><Search className="h-8 w-8" /></div>
              <p className="mt-5 text-xl font-bold" style={{ color: 'var(--text-main)' }}>
                {query ? t('customers.noMatchingRecords') : t('customers.noCustomersYet')}
              </p>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-soft)' }}>
                {query ? t('customers.tryDifferent') : t('customers.addFirstCustomer')}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3 animate-stagger">
              {filtered.map((customer) => {
                const status = getCustomerStatus(customer);
                return (
                  <div key={customer.id} className="card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <MemberAvatar photoURL={customer.photo_url} name={customer.name} size={64} rounded="24px" />
                        <div>
                          <p className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>{customer.name}</p>
                          <p className="mt-1 text-sm" style={{ color: 'var(--text-soft)' }}>{customer.mobile}</p>
                        </div>
                      </div>
                      <span className={STATUS_STYLES[status]}>
                        {FILTER_LABELS[status] || status}
                      </span>
                    </div>

                    <div className="mt-5 space-y-2 rounded-[18px] border p-4" style={{ borderColor: 'var(--border-soft)', background: 'rgba(255, 252, 248, 0.84)' }}>
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: 'var(--text-soft)' }}>{t('customers.mealPlan')}</span>
                        <strong style={{ color: 'var(--text-main)' }}>{getMealPlanLabel(customer.meal_plan)}</strong>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: 'var(--text-soft)' }}>{t('customers.dueDate')}</span>
                        <strong style={{ color: 'var(--text-main)' }}>{formatDate(customer.end_date)}</strong>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: 'var(--text-soft)' }}>{t('common.pending')}</span>
                        <strong style={{ color: status === 'overdue' ? 'var(--accent-danger)' : 'var(--accent-primary-dark)' }}>
                          {formatCurrency(customer.amount_due || 0)}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2 customer-actions-row">
                      <button className="btn-secondary" onClick={() => navigate(`/customers/${customer.id}`)}>
                        {t('common.view')} <ChevronRight className="h-4 w-4" />
                      </button>
                      {!isSuspended && (
                        <>
                          <button className="btn-soft" onClick={() => navigate(`/customers/${customer.id}/edit`)}
                            style={{ width: 44, height: 44, padding: 0, flexShrink: 0 }} title={t('common.edit')}>
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button className="btn-soft" onClick={() => navigate(`/customers/${customer.id}/pay`)}
                            style={{ width: 44, height: 44, padding: 0, flexShrink: 0 }} title={t('customers.recordPayment')}>
                            <CreditCard className="h-4 w-4" />
                          </button>
                          {customer.mobile && (
                            <a className="btn-soft" href={`tel:${customer.mobile}`}
                              style={{ width: 44, height: 44, padding: 0, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title={t('customers.call')}>
                              <Phone className="h-4 w-4" />
                            </a>
                          )}
                          <button className="btn-whatsapp" onClick={() => sendPaymentReminder(customer)}
                            style={{ width: 44, height: 44, padding: 0, flexShrink: 0 }} title={t('customers.whatsapp')}>
                            <MessageCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </BusinessShell>
  );
}
