import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, CreditCard, IndianRupee, MessageCircle, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { subscribeToDueMembers } from '../supabase/db';
import { formatCurrency, formatDate, getDaysOverdue, getMemberStatus } from '../utils/subscriptionUtils';
import BusinessShell from '../components/BusinessShell';
import MemberAvatar from '../components/MemberAvatar';
import { MemberRowSkeleton } from '../components/SkeletonBlock';
import QuickPayModal from '../components/QuickPayModal';

export default function DueList() {
  const { business } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payCustomer, setPayCustomer] = useState(null);

  useEffect(() => {
    if (!business?.id) return undefined;

    const unsubscribe = subscribeToDueMembers(business.id, (list) => {
      setMembers(list);
      setLoading(false);
    });

    return unsubscribe;
  }, [business?.id]);

  const dueToday = useMemo(() => members.filter((member) => getMemberStatus(member) === 'due'), [members]);
  const overdue = useMemo(
    () =>
      members
        .filter((member) => getMemberStatus(member) === 'overdue')
        .sort((left, right) => getDaysOverdue(right) - getDaysOverdue(left)),
    [members],
  );

  const dueAmount = members.reduce((sum, member) => sum + Number(member.amountDue || member.subscriptionAmount || 0), 0);

  const buildWALink = (member) => {
    const phone = `91${(member.mobile || '').replace(/\D/g, '')}`;
    const message = encodeURIComponent(
      `Hi ${member.name}, your tiffin subscription balance of ${formatCurrency(member.amountDue || member.subscriptionAmount)} is pending. Please renew at your earliest convenience. Thank you.`,
    );
    return `https://wa.me/${phone}?text=${message}`;
  };

  const MemberCard = ({ member, overdueStatus }) => (
    <div className="member-row" style={{ alignItems: 'center' }}>
      <button
        className="flex flex-1 items-center gap-4 text-left"
        style={{ background: 'none', border: 'none', padding: 0 }}
        onClick={() => navigate(`/customers/${member.id}`)}
      >
        <MemberAvatar photoURL={member.photoURL} name={member.name} size={58} rounded="22px" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold" style={{ color: 'var(--text-main)' }}>
            {member.name}
          </p>
          <p className="truncate text-xs" style={{ color: 'var(--text-soft)' }}>
            {member.mobile} · {t('common.due')} {formatDate(member.subscriptionEndDate)}
          </p>
          {member.amountPaid > 0 && (
            <p className="mt-1 text-xs" style={{ color: 'var(--accent-warning)' }}>
              {t('dueList.partialPayment', { amount: formatCurrency(member.amountDue) })}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
            {formatCurrency(member.amountDue || member.subscriptionAmount)}
          </p>
          <span className={overdueStatus ? 'badge-danger' : 'badge-warning'}>
            {overdueStatus ? t('dueList.daysOverdueBadge', { count: getDaysOverdue(member) }) : t('dueList.dueTodayBadge')}
          </span>
        </div>
      </button>

      <div className="ml-2 flex items-center gap-2">
        <button
          className="btn-primary"
          style={{
            padding: '7px 12px', fontSize: '11px', minWidth: 0, width: 'auto',
            background: 'linear-gradient(135deg, rgba(42, 143, 121, 0.92), rgba(76, 175, 140, 0.92))',
          }}
          onClick={() => setPayCustomer(member)}
          title="Quick collect & renew"
        >
          <IndianRupee className="h-3.5 w-3.5" />
          {t('dashboard.collect')}
        </button>
        {member.mobile && (
          <>
            <a className="btn-soft" href={`tel:${member.mobile}`} title={t('customers.call')}>
              <Phone className="h-4 w-4" />
            </a>
            <a className="btn-soft" href={buildWALink(member)} target="_blank" rel="noreferrer" title={t('customers.whatsapp')}>
              <MessageCircle className="h-4 w-4" />
            </a>
          </>
        )}
      </div>
    </div>
  );

  return (
    <BusinessShell
      title={t('dueList.title')}
      subtitle={t('dueList.subtitle', { count: members.length, members: t('common.customers').toLowerCase() })}
    >
      <div className="space-y-6">
        <section className="hero-card">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))]">
            <div>
              <p className="section-title">{t('dueList.ledgerSnapshot')}</p>
              <h2
                className="mt-3 text-3xl font-extrabold md:text-4xl"
                style={{ color: 'var(--text-main)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {t('dueList.heroText')}
              </h2>
            </div>

            <div className="glass-panel p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-faint)' }}>
                {t('dueList.totalPending')}
              </p>
              <p className="mt-3 text-2xl font-extrabold" style={{ color: 'var(--accent-primary-dark)' }}>
                {formatCurrency(dueAmount)}
              </p>
            </div>

            <div className="glass-panel p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-faint)' }}>
                {t('dueList.dueToday')}
              </p>
              <p className="mt-3 text-2xl font-extrabold" style={{ color: 'var(--accent-warning)' }}>
                {dueToday.length}
              </p>
            </div>

            <div className="glass-panel p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-faint)' }}>
                {t('common.overdue')}
              </p>
              <p className="mt-3 text-2xl font-extrabold" style={{ color: 'var(--accent-danger)' }}>
                {overdue.length}
              </p>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <MemberRowSkeleton key={index} />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="card py-16 text-center">
            <div className="empty-state-icon mx-auto">
              <CreditCard className="h-8 w-8" />
            </div>
            <p className="mt-5 text-xl font-bold" style={{ color: 'var(--text-main)' }}>
              {t('dueList.allClear')}
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-soft)' }}>
              {t('dueList.noPending')}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2 animate-stagger">
            <section className="card">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5" style={{ color: 'var(--accent-warning)' }} />
                <div>
                  <p className="section-title">{t('dueList.dueToday')}</p>
                  <h3 className="mt-1 text-2xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-main)' }}>
                    {t('dueList.immediateReminders')}
                  </h3>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {dueToday.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed px-5 py-10 text-center" style={{ borderColor: 'var(--border-strong)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-soft)' }}>
                      {t('dueList.noOneDueToday')}
                    </p>
                  </div>
                ) : (
                  dueToday.map((member) => <MemberCard key={member.id} member={member} overdueStatus={false} />)
                )}
              </div>
            </section>

            <section className="card">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5" style={{ color: 'var(--accent-danger)' }} />
                <div>
                  <p className="section-title">{t('common.overdue')}</p>
                  <h3 className="mt-1 text-2xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-main)' }}>
                    {t('dueList.highPriority')}
                  </h3>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {overdue.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed px-5 py-10 text-center" style={{ borderColor: 'var(--border-strong)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-soft)' }}>
                      {t('dueList.noOverdueAccounts')}
                    </p>
                  </div>
                ) : (
                  overdue.map((member) => <MemberCard key={member.id} member={member} overdueStatus />)
                )}
              </div>
            </section>
          </div>
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
