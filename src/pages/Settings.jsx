import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Globe, LogOut, Save, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { updateBusiness, getCustomersByBusiness } from '../supabase/db';
import { formatCurrency, formatDate, getCustomerStatus, getMealPlanLabel } from '../utils/subscriptionUtils';
import BusinessShell from '../components/BusinessShell';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Settings() {
  const { business, logout, refreshBusiness } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    business_name: business?.business_name || '',
    mobile: business?.mobile || '',
    owner_name: business?.owner_name || '',
  });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateBusiness(business.id, {
        business_name: form.business_name.trim(),
        mobile: form.mobile.trim(),
        owner_name: form.owner_name.trim(),
      });
      await refreshBusiness();
      toast.success(t('settings.profileUpdated'));
    } catch (error) {
      toast.error(error.message || t('settings.failedToUpdate'));
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const customers = await getCustomersByBusiness(business.id);
      if (customers.length === 0) { toast.error(t('settings.noDataToExport')); setExporting(false); return; }

      const headers = ['Name', 'Mobile', 'Address', 'Status', 'Meal Plan', 'Amount', 'Start', 'End', 'Paid', 'Due'];
      const rows = customers.map(c => [
        c.name, c.mobile, c.address, getCustomerStatus(c), getMealPlanLabel(c.meal_plan),
        c.subscription_amount, formatDate(c.start_date), formatDate(c.end_date), c.amount_paid, c.amount_due,
      ]);
      const csv = [headers, ...rows].map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trackbook-export-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t('settings.exportedRecords', { count: customers.length }));
    } catch (error) {
      toast.error(t('settings.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t('common.signedOut'));
      navigate('/login');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <BusinessShell title={t('settings.title')} subtitle={t('settings.subtitle')}>
      <div className="space-y-6">
        {/* Business Profile */}
        <section className="card">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
            <div>
              <p className="section-title">{t('settings.businessProfile')}</p>
              <h3 className="mt-1 text-xl font-extrabold" style={{ color: 'var(--text-main)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {t('settings.editDetails')}
              </h3>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="settings-name">{t('settings.businessName')}</label>
              <input id="settings-name" className="input" value={form.business_name} onChange={set('business_name')} />
            </div>
            <div>
              <label className="label" htmlFor="settings-owner">{t('settings.ownerName')}</label>
              <input id="settings-owner" className="input" value={form.owner_name} onChange={set('owner_name')} />
            </div>
            <div>
              <label className="label" htmlFor="settings-mobile">{t('common.mobile')}</label>
              <input id="settings-mobile" className="input" value={form.mobile} onChange={set('mobile')} />
            </div>
            <div>
              <label className="label">{t('common.email')}</label>
              <div className="input flex items-center" style={{ background: 'rgba(242, 235, 227, 0.5)', color: 'var(--text-faint)' }}>
                {business?.email || '—'}
              </div>
            </div>
          </div>

          <button className="btn-primary mt-5" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" /> : <Save className="h-4 w-4" />}
            {saving ? t('settings.saving') : t('settings.saveChanges')}
          </button>
        </section>

        {/* Language */}
        <section className="card">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
            <div>
              <p className="section-title">{t('settings.languageSection')}</p>
              <h3 className="mt-1 text-xl font-extrabold" style={{ color: 'var(--text-main)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {t('settings.chooseLanguage')}
              </h3>
            </div>
          </div>
          <div className="mt-4">
            <LanguageSwitcher variant="page" />
          </div>
        </section>

        {/* Data Export */}
        <section className="card">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5" style={{ color: 'var(--accent-tertiary)' }} />
            <div>
              <p className="section-title">{t('settings.dataExport')}</p>
              <h3 className="mt-1 text-xl font-extrabold" style={{ color: 'var(--text-main)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {t('settings.downloadData')}
              </h3>
            </div>
          </div>
          <p className="mt-4 text-sm" style={{ color: 'var(--text-soft)' }}>
            {t('settings.exportDescription')}
          </p>
          <button className="btn-secondary mt-4" onClick={handleExport} disabled={exporting}>
            {exporting ? <span className="spinner" /> : <Download className="h-4 w-4" />}
            {exporting ? t('settings.exporting') : t('settings.exportToCsv')}
          </button>
        </section>

        {/* Logout */}
        <section className="card">
          <button className="btn-danger" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> {t('common.signOut')}
          </button>
        </section>
      </div>
    </BusinessShell>
  );
}
