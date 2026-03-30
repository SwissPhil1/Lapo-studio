import i18n from '@/i18n';

function getLocale() {
  return i18n.language === 'fr' ? 'fr-CH' : 'en-US';
}

export function formatCurrency(amount: number, currency: string = "CHF"): string {
  return new Intl.NumberFormat(getLocale(), {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatLapoCash(amount: number): string {
  return new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + " LC";
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat(getLocale(), {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat(getLocale(), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
