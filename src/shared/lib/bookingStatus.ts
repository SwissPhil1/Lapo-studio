/**
 * Booking Status Constants and Helpers
 * 
 * Status lifecycle (automated via webhooks in Payouts app):
 * - zapier-webhook creates booking → status = 'scheduled'
 * - payments-webhook receives invoice → status = 'completed' + booking_value
 * - zapier-webhook receives cancellation → status = 'cancelled'
 * - zapier-webhook receives no-show → status = 'no_show'
 * - zapier-webhook detects reschedule → status = 'rescheduled' (ancien RDV)
 * 
 * Webhooks are deployed in the Payouts app, not this CRM.
 * See: https://dcrlaoudqcfbauxalbgs.supabase.co/functions/v1/zapier-webhook
 *      https://dcrlaoudqcfbauxalbgs.supabase.co/functions/v1/payments-webhook
 */

export const BOOKING_STATUS = {
  SCHEDULED: 'scheduled',  // RDV créé, en attente (set by zapier-webhook)
  COMPLETED: 'completed',  // RDV terminé ET payé (set by payments-webhook)
  CANCELLED: 'cancelled',  // RDV annulé (set by zapier-webhook)
  NO_SHOW: 'no_show',      // Patient absent (set by zapier-webhook)
  RESCHEDULED: 'rescheduled', // RDV reporté (détecté automatiquement par zapier-webhook)
  PENDING: 'pending',      // Valeur par défaut DB (rarement utilisé)
} as const;

export type BookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];

export const BOOKING_STATUS_LABELS_FR: Record<string, string> = {
  scheduled: 'Planifié',
  completed: 'Payé',
  cancelled: 'Annulé',
  no_show: 'Non présenté',
  rescheduled: 'Reporté',
  pending: 'En attente',
};

export const BOOKING_STATUS_LABELS_EN: Record<string, string> = {
  scheduled: 'Scheduled',
  completed: 'Paid',
  cancelled: 'Cancelled',
  no_show: 'No Show',
  rescheduled: 'Rescheduled',
  pending: 'Pending',
};

export const BOOKING_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: 'bg-primary/10', text: 'text-primary' },
  completed: { bg: 'bg-success/10', text: 'text-success' },
  cancelled: { bg: 'bg-muted', text: 'text-muted-foreground' },
  no_show: { bg: 'bg-destructive/10', text: 'text-destructive' },
  rescheduled: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  pending: { bg: 'bg-warning/10', text: 'text-warning' },
};

/**
 * Check if a booking is "finished" (no action needed for attendance tracking)
 */
export function isBookingFinished(status: string): boolean {
  const finishedStatuses = [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.NO_SHOW, BOOKING_STATUS.RESCHEDULED];
  return finishedStatuses.includes(status as typeof finishedStatuses[number]);
}

/**
 * Check if a past booking needs attention (still marked as scheduled)
 * Note: With automated webhooks, this should rarely happen
 */
export function isPastBookingUnprocessed(status: string, bookingDate: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return bookingDate <= today && status === BOOKING_STATUS.SCHEDULED;
}

/**
 * Check if booking counts toward recall calculations
 * Only completed and scheduled (past) bookings count as "attended"
 */
export function isBookingForRecall(status: string, bookingDate: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return (
    status === BOOKING_STATUS.COMPLETED ||
    (status === BOOKING_STATUS.SCHEDULED && bookingDate <= today)
  );
}

/**
 * Get the display label for a status
 */
export function getStatusLabel(status: string, locale: 'fr' | 'en' = 'en'): string {
  const labels = locale === 'fr' ? BOOKING_STATUS_LABELS_FR : BOOKING_STATUS_LABELS_EN;
  return labels[status] || status;
}

/**
 * Get color classes for a status
 */
export function getStatusColors(status: string): { bg: string; text: string } {
  return BOOKING_STATUS_COLORS[status] || { bg: 'bg-muted', text: 'text-muted-foreground' };
}
