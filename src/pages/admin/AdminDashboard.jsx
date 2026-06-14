import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle2, LogOut, Shield, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { subscribeToBusinesses, updateBusiness } from '../../supabase/db';
import { formatDate } from '../../utils/subscriptionUtils';
import ConfirmModal from '../../components/ConfirmModal';

const STATUS_BADGES = {
  pending: 'badge-warning',
  active: 'badge-success',
  suspended: 'badge-danger',
};

export default function AdminDashboard() {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [processing, setProcessing] = useState(false);

  const STATUS_LABELS = {
    pending: t('common.pending'),
    active: t('common.active'),
    suspended: t('admin.suspend'),
  };

  const ACTION_MAP = {
    active: { label: t('admin.approve'), title: t('admin.approveTitle'), toast: t('admin.businessApproved') },
    suspended: { label: t('admin.suspend'), title: t('admin.suspendTitle'), toast: t('admin.businessSuspended') },
    activate: { label: t('admin.activate'), title: t('admin.activateTitle'), toast: t('admin.businessActivated') },
  };

  useEffect(() => {
    const unsub = subscribeToBusinesses((data) => {
      setBusinesses(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleAction = async (bizId, newStatus) => {
    setProcessing(true);
    try {
      await updateBusiness(bizId, { status: newStatus });
      const toastMsg = newStatus === 'active' ? t('admin.businessApproved') : newStatus === 'suspended' ? t('admin.businessSuspended') : t('admin.businessActivated');
      toast.success(toastMsg);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
      setConfirm(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <div className="business-topbar">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))' }}>
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-faint)' }}>{t('admin.title')}</p>
            <h1 className="text-xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-main)' }}>
              {t('admin.businessManagement')}
            </h1>
          </div>
        </div>
        <button className="btn-ghost" onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> {t('admin.logout')}
        </button>
      </div>

      <div className="business-body" style={{ width: 'min(1100px, calc(100% - 32px))', margin: '0 auto', padding: '28px 0' }}>
        {loading ? (
          <div className="card flex items-center justify-center py-16">
            <div className="spinner" style={{ color: 'var(--accent-primary)' }} />
          </div>
        ) : businesses.length === 0 ? (
          <div className="card py-16 text-center">
            <p className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>{t('admin.noBusinesses')}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>{t('admin.business')}</th>
                  <th>{t('admin.owner')}</th>
                  <th>{t('admin.mobile')}</th>
                  <th>{t('admin.created')}</th>
                  <th>{t('admin.status')}</th>
                  <th>{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((biz) => (
                  <tr key={biz.id}>
                    <td className="font-bold">{biz.business_name || '—'}</td>
                    <td>{biz.owner_name || '—'}</td>
                    <td>{biz.mobile || '—'}</td>
                    <td>{formatDate(biz.created_at)}</td>
                    <td>
                      <span className={STATUS_BADGES[biz.status]}>{STATUS_LABELS[biz.status] || biz.status}</span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {biz.status === 'pending' && (
                          <button className="btn-soft" style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => setConfirm({ id: biz.id, action: 'active', label: t('admin.approve') })}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> {t('admin.approve')}
                          </button>
                        )}
                        {biz.status === 'active' && (
                          <button className="btn-soft" style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--accent-danger)' }}
                            onClick={() => setConfirm({ id: biz.id, action: 'suspended', label: t('admin.suspend') })}>
                            <XCircle className="h-3.5 w-3.5" /> {t('admin.suspend')}
                          </button>
                        )}
                        {biz.status === 'suspended' && (
                          <button className="btn-soft" style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--accent-tertiary)' }}
                            onClick={() => setConfirm({ id: biz.id, action: 'active', label: t('admin.activate') })}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> {t('admin.activate')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmModal
          isOpen
          title={`${confirm.label}?`}
          message={t('admin.statusChangeMessage', { status: confirm.action })}
          confirmLabel={confirm.label}
          variant={confirm.action === 'suspended' ? 'danger' : 'primary'}
          loading={processing}
          onConfirm={() => handleAction(confirm.id, confirm.action)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
