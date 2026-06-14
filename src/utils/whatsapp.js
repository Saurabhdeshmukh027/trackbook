/**
 * WhatsApp reminder utilities
 * Opens WhatsApp with pre-filled messages for due/payment reminders
 */

const WHATSAPP_BASE = 'https://wa.me';

const formatPhone = (mobile) => {
  // Remove spaces, dashes, and non-numeric chars except +
  let cleaned = mobile.replace(/[^0-9+]/g, '');
  // If starts with 0, replace with +91 (India)
  if (cleaned.startsWith('0')) {
    cleaned = '+91' + cleaned.slice(1);
  }
  // If doesn't start with +, assume India
  if (!cleaned.startsWith('+')) {
    cleaned = '+91' + cleaned;
  }
  // Remove the + for WhatsApp URL
  return cleaned.replace('+', '');
};

export const sendDueReminder = (customer) => {
  const phone = formatPhone(customer.mobile);
  const message = encodeURIComponent(
    `Hello ${customer.name},\n\n` +
    `Your tiffin subscription expires on ${formatDateForMsg(customer.end_date)}.\n` +
    `Please renew.\n\n` +
    `Thank you!`
  );
  window.open(`${WHATSAPP_BASE}/${phone}?text=${message}`, '_blank');
};

export const sendPaymentReminder = (customer) => {
  const phone = formatPhone(customer.mobile);
  const amount = Number(customer.amount_due || 0).toLocaleString('en-IN');
  const message = encodeURIComponent(
    `Hello ${customer.name},\n\n` +
    `Your pending amount is ₹${amount}.\n` +
    `Please clear payment.\n\n` +
    `Thank you!`
  );
  window.open(`${WHATSAPP_BASE}/${phone}?text=${message}`, '_blank');
};

export const openWhatsAppSupport = () => {
  window.open(`${WHATSAPP_BASE}/919999999999?text=${encodeURIComponent('Hi, I need help with my TrackBook account.')}`, '_blank');
};

function formatDateForMsg(value) {
  if (!value) return '--';
  const date = new Date(value);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
