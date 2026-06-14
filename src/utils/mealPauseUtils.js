import { addDays } from 'date-fns';
import { Timestamp } from '../supabase/db';
import { toDate } from './subscriptionUtils';

export const countPauseDays = (pauses) => {
  return pauses.reduce((total, pause) => total + (pause.days || 0), 0);
};

export const buildSettleData = (customer, totalDays) => {
  const currentEnd = toDate(customer.end_date);
  if (!currentEnd) return {};
  const newEnd = addDays(currentEnd, totalDays);
  return {
    end_date: Timestamp.fromDate(newEnd),
  };
};
