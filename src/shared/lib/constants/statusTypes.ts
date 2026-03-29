/**
 * TypeScript types for all status enums in the system
 * These match the database enums and CHECK constraints
 */

export type ReferralStatus = 
  | "pending" 
  | "booked" 
  | "confirmed" 
  | "cancelled" 
  | "invalid"
  | "expired";

export type CommissionStatus = 
  | "pending" 
  | "paid" 
  | "cancelled" 
  | "reversed"
  | "converted";

export type PayoutBatchStatus = 
  | "open" 
  | "closed"
  | "paid";

export type LapoCashTransactionType =
  | "commission_conversion"
  | "birthday_gift"
  | "workshop_reward"
  | "referral_bonus"
  | "redemption"
  | "adjustment"
  | "expiration"
  | "other";

export type BookingStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no_show"
  | "rescheduled";

export type StatusEntityType = 
  | "referral" 
  | "commission" 
  | "batch"
  | "lapoCash"
  | "booking";

export const BOOKING_STATUSES = {
  SCHEDULED: 'scheduled' as BookingStatus,
  COMPLETED: 'completed' as BookingStatus,
  CANCELLED: 'cancelled' as BookingStatus,
  NO_SHOW: 'no_show' as BookingStatus,
  RESCHEDULED: 'rescheduled' as BookingStatus,
} as const;

/**
 * Constants for status values (for use in code)
 */
export const COMMISSION_STATUSES = {
  PENDING: 'pending' as CommissionStatus,
  PAID: 'paid' as CommissionStatus,
  CANCELLED: 'cancelled' as CommissionStatus,
  REVERSED: 'reversed' as CommissionStatus,
  CONVERTED: 'converted' as CommissionStatus,
} as const;

export const REFERRAL_STATUSES = {
  PENDING: 'pending' as ReferralStatus,
  BOOKED: 'booked' as ReferralStatus,
  CONFIRMED: 'confirmed' as ReferralStatus,
  CANCELLED: 'cancelled' as ReferralStatus,
  INVALID: 'invalid' as ReferralStatus,
  EXPIRED: 'expired' as ReferralStatus,
} as const;

export const BATCH_STATUSES = {
  OPEN: 'open' as PayoutBatchStatus,
  CLOSED: 'closed' as PayoutBatchStatus,
  PAID: 'paid' as PayoutBatchStatus,
} as const;
