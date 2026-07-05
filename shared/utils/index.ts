import type { LanguageCode } from '../types';

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

// name_hi/description_hi are optional on a product; fall back to English
// whenever the owner hasn't filled in the Hindi field yet.
export function localize(
  language: LanguageCode,
  en: string,
  hi: string | undefined | null
): string {
  if (language === 'hi' && hi && hi.trim().length > 0) return hi;
  return en;
}

export function buildUpiLink(params: {
  payeeVpa: string;
  payeeName: string;
  amount: number;
  transactionNote?: string;
  transactionRef?: string;
}): string {
  const query = new URLSearchParams({
    pa: params.payeeVpa,
    pn: params.payeeName,
    am: params.amount.toFixed(2),
    cu: 'INR',
  });
  if (params.transactionNote) query.set('tn', params.transactionNote);
  if (params.transactionRef) query.set('tr', params.transactionRef);
  return `upi://pay?${query.toString()}`;
}

export function buildTelLink(phone: string): string {
  return `tel:${phone}`;
}

export function buildWhatsappLink(phone: string, message?: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  const base = `https://wa.me/${digits.replace('+', '')}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function formatDateTime(epochMs: number): string {
  return new Date(epochMs).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
