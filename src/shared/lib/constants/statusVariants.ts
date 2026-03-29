import { ReferralStatus, CommissionStatus, PayoutBatchStatus, LapoCashTransactionType, BookingStatus } from "./statusTypes";

/**
 * Central configuration for status badge variants (colors)
 * Uses semantic tokens from the design system
 */

type VariantStyle = string;

export const referralStatusVariants: Record<ReferralStatus, VariantStyle> = {
  pending: "bg-muted text-muted-foreground border-border",
  booked: "bg-info-bg text-info border-info/20",
  confirmed: "bg-success-bg text-success border-success/20",
  cancelled: "bg-destructive-bg text-destructive border-destructive/20",
  invalid: "bg-destructive-bg text-destructive border-destructive/20",
  expired: "bg-muted/50 text-muted-foreground/70 border-border/50",
};

export const commissionStatusVariants: Record<CommissionStatus, VariantStyle> = {
  pending: "bg-warning-bg text-warning border-warning/20",
  paid: "bg-success-bg text-success border-success/20",
  cancelled: "bg-muted text-muted-foreground border-border",
  reversed: "bg-muted text-muted-foreground border-border",
  converted: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
};

export const batchStatusVariants: Record<PayoutBatchStatus, VariantStyle> = {
  open: "bg-info-bg text-info border-info/20",
  closed: "bg-success-bg text-success border-success/20",
  paid: "bg-primary/10 text-primary border-primary/20",
};

export const lapoCashStatusVariants: Record<LapoCashTransactionType, VariantStyle> = {
  commission_conversion: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  birthday_gift: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800",
  workshop_reward: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  referral_bonus: "bg-success-bg text-success border-success/20",
  redemption: "bg-info-bg text-info border-info/20",
  adjustment: "bg-muted text-muted-foreground border-border",
  expiration: "bg-destructive-bg text-destructive border-destructive/20",
  other: "bg-muted text-muted-foreground border-border",
};

export const bookingStatusVariants: Record<BookingStatus, VariantStyle> = {
  scheduled: "bg-info-bg text-info border-info/20",
  completed: "bg-success-bg text-success border-success/20",
  cancelled: "bg-muted text-muted-foreground border-border",
  no_show: "bg-destructive-bg text-destructive border-destructive/20",
  rescheduled: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
};
