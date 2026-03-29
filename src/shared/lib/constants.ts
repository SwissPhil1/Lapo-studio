// Application-wide constants

export const CURRENCY = 'CHF';
export const CURRENCY_LOCALE = 'fr-CH';

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString(CURRENCY_LOCALE)} ${CURRENCY}`;
}
