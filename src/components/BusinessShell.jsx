import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  PauseCircle,
  Search,
  Settings,
  UserPlus,
  Users,
  Wallet,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import BottomNav from './BottomNav';
import SuspendedBanner from './SuspendedBanner';
import LanguageSwitcher from './LanguageSwitcher';
import toast from 'react-hot-toast';

function matchesPath(pathname, to) {
  if (to === '/customers') {
    return (pathname === '/customers' || pathname.startsWith('/customers/')) && !pathname.includes('/collections');
  }
  if (to === '/collections') {
    return pathname === '/collections' || pathname.includes('/collections');
  }
  return pathname === to;
}

export default function BusinessShell({
  title,
  subtitle,
  actions,
  children,
  contentClassName = '',
}) {
  const { business, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuspended = business?.status === 'suspended';

  const NAV_ITEMS = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/customers', icon: Users, label: t('nav.customers') },
    { to: '/meal-pause', icon: PauseCircle, label: t('nav.mealPause') },
    { to: '/expenses', icon: Wallet, label: t('nav.expenses') },
    { to: '/collections', icon: Package, label: t('nav.collections') || 'Collections' },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
  ];

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
    <div className="app-shell">
      {isSuspended && <SuspendedBanner />}
      <div className="business-shell">
        <aside className="business-sidebar">
          <div className="mb-8 px-2">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                style={{ background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))' }}
              >
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="gradient-text text-2xl font-extrabold leading-none">TrackBook</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--text-faint)' }}>
                  {t('common.tagline')}
                </p>
              </div>
            </div>
          </div>

          <div className="mx-2 mb-6 rounded-[24px] border px-4 py-4" style={{ borderColor: 'rgba(214, 194, 174, 0.72)', background: 'rgba(255, 251, 245, 0.72)' }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-faint)' }}>
              {t('common.business')}
            </p>
            <p className="mt-2 font-bold text-lg" style={{ color: 'var(--text-main)' }}>
              {business?.business_name || 'TrackBook Business'}
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-soft)' }}>
              {t('common.tiffinOperations')}
            </p>
          </div>

          <nav className="flex-1 space-y-2 px-2">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
              const active = matchesPath(location.pathname, to);
              return (
                <NavLink key={to} to={to} className={`sidebar-link ${active ? 'active' : ''}`}>
                  <Icon />
                  <span>{label}</span>
                </NavLink>
              );
            })}
          </nav>

          {!isSuspended && (
            <button className="btn-primary mt-6" onClick={() => navigate('/customers/add')}>
              <UserPlus className="h-4 w-4" />
              {t('common.addCustomer')}
            </button>
          )}

          <div className="mt-6 border-t px-2 pt-5" style={{ borderColor: 'rgba(214, 194, 174, 0.72)' }}>
            <div className="mb-3">
              <LanguageSwitcher variant="sidebar" />
            </div>
            <button className="sidebar-link w-full" onClick={() => navigate('/customers?search=' + Date.now())}>
              <Search />
              <span>{t('common.searchCustomers')}</span>
            </button>
            <button className="sidebar-link w-full" onClick={handleLogout}>
              <LogOut />
              <span>{t('common.logout')}</span>
            </button>
          </div>
        </aside>

        <main className="business-main">
          <div className="business-topbar">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] hidden sm:block" style={{ color: 'var(--text-faint)' }}>
                TrackBook
              </p>
              <h1
                className="mt-0 sm:mt-1 truncate font-extrabold"
                style={{ color: 'var(--text-main)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.1rem, 0.9rem + 1vw, 2rem)' }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 truncate text-sm hidden sm:block" style={{ color: 'var(--text-soft)' }}>
                  {subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
          </div>

          <div className={`business-body ${contentClassName}`}>{children}</div>
        </main>
      </div>

      {!isSuspended && location.pathname === '/customers' && (
        <button className="fab mobile-only lg:hidden" onClick={() => navigate('/customers/add')}>
          <UserPlus className="h-6 w-6" />
        </button>
      )}

      <BottomNav />
    </div>
  );
}
