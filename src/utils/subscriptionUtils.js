import {
  addDays,
  addMonths,
  differenceInDays,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isToday,
  startOfMonth,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { Timestamp } from '../supabase/db';

export const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value?.toDate) return value.toDate();
  return new Date(value);
};

export const calcEndDate = (startDate, durationDays) => {
  const start = toDate(startDate);
  return addDays(start, durationDays - 1);
};

export const getCustomerStatus = (customer) => {
  const endDate = toDate(customer.end_date);
  if (!endDate) return 'active';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const hasDue = (customer.amount_due ?? 0) > 0;

  if (isToday(end)) return hasDue ? 'due' : 'active';
  if (isBefore(end, today)) return hasDue ? 'overdue' : 'expired';
  return 'active';
};

// Alias used by DueList
export const getMemberStatus = getCustomerStatus;

export const getDaysOverdue = (customer) => {
  const endDate = toDate(customer.end_date);
  if (!endDate) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, differenceInDays(today, end));
};

export const buildRenewalData = (customer) => {
  const previousEnd = toDate(customer.end_date);
  const nextStart = addDays(previousEnd, 1);
  const nextEnd = calcEndDate(nextStart, customer.subscription_duration);

  return {
    start_date: Timestamp.fromDate(nextStart),
    end_date: Timestamp.fromDate(nextEnd),
    amount_paid: 0,
    amount_due: customer.subscription_amount,
    status: 'active',
  };
};

export const buildQuickRestartData = (customer) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const previousEnd = toDate(customer.end_date);
  let nextStart;
  if (previousEnd && previousEnd >= today) {
    nextStart = addDays(previousEnd, 1);
  } else {
    nextStart = today;
  }
  const nextEnd = calcEndDate(nextStart, customer.subscription_duration || 30);

  return {
    start_date: Timestamp.fromDate(nextStart),
    end_date: Timestamp.fromDate(nextEnd),
    amount_paid: customer.subscription_amount || 0,
    amount_due: 0,
    status: 'active',
  };
};


export const calcDashboardStats = (customers, payments) => {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const expectedThisMonth = customers
    .filter((customer) => {
      const endDate = toDate(customer.end_date);
      return endDate && endDate >= monthStart && endDate <= monthEnd;
    })
    .reduce((sum, customer) => sum + (customer.subscription_amount || 0), 0);

  const collectedThisMonth = payments
    .filter((payment) => {
      const paymentDate = toDate(payment.date);
      return paymentDate && paymentDate >= monthStart && paymentDate <= monthEnd;
    })
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);

  return {
    expectedThisMonth,
    collectedThisMonth,
    remainingThisMonth: Math.max(0, expectedThisMonth - collectedThisMonth),
  };
};

export const formatDate = (value) => {
  const date = toDate(value);
  if (!date) return '--';
  return format(date, 'dd MMM yyyy');
};

export const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export const calcMonthlyRevenue = (payments, months = 6) => {
  const result = [];
  const now = new Date();

  for (let index = months - 1; index >= 0; index -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = format(monthDate, 'yyyy-MM');
    const label = format(monthDate, 'MMM');
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);

    const collected = payments
      .filter((payment) => {
        const paymentDate = toDate(payment.date);
        return paymentDate && paymentDate >= start && paymentDate <= end;
      })
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    result.push({ key, label, collected });
  }

  return result;
};

// Meal plan duration in days
export const MEAL_PLAN_DURATIONS = {
  monthly: 30,
  quarterly: 90,
};

export const getMealPlanDuration = (plan, customDays = 30) => {
  if (plan === 'custom') return customDays;
  return MEAL_PLAN_DURATIONS[plan] || 30;
};

export const getMealPlanLabel = (plan) => {
  const labels = { monthly: 'Monthly', quarterly: 'Quarterly', custom: 'Custom' };
  return labels[plan] || 'Monthly';
};

// ─── Expiring Soon Helpers ──────────────────────────────────────────────────

/**
 * Returns how many days until the customer's subscription expires.
 * Negative means already expired, 0 means today, positive means future.
 */
export const getDaysUntilExpiry = (customer) => {
  const endDate = toDate(customer.end_date);
  if (!endDate) return Infinity;
  const today = startOfDay(new Date());
  const end = startOfDay(new Date(endDate));
  return differenceInDays(end, today);
};

/**
 * Filters customers expiring within the next `days` days (default 7).
 * Only returns customers still active (not yet expired).
 */
export const getExpiringSoon = (customers, days = 7) => {
  return customers
    .filter((c) => {
      const daysLeft = getDaysUntilExpiry(c);
      return daysLeft >= 1 && daysLeft <= days;
    })
    .sort((a, b) => getDaysUntilExpiry(a) - getDaysUntilExpiry(b));
};

/**
 * Calculate today's collection stats from payment list.
 */
export const calcTodayStats = (payments) => {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const todayPayments = payments.filter((p) => {
    const d = toDate(p.date);
    return d && d >= todayStart && d <= todayEnd;
  });

  return {
    count: todayPayments.length,
    total: todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
  };
};
