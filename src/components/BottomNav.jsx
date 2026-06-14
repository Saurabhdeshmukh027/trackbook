import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AlertCircle, CreditCard, LayoutDashboard, Settings, Users } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

function isActive(pathname, to) {
  if (to === '/customers') {
    return pathname === '/customers' || pathname.startsWith('/customers/');
  }
  return pathname === to;
}

export default function BottomNav() {
  const location = useLocation();
  const { t } = useLanguage();

  const tabs = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.home') },
    { to: '/customers', icon: Users, label: t('nav.customers') },
    { to: '/due-list', icon: AlertCircle, label: t('nav.dueList') },
    { to: '/payments', icon: CreditCard, label: t('nav.payments') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
  ];

  return (
    <nav className="bottom-nav lg:hidden">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={`nav-item ${isActive(location.pathname, to) ? 'active' : ''}`}
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
