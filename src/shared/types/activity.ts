export type ActivityCategory = "commission" | "lapo_cash" | "referral";

export interface ActivityItem {
  id: string;
  created_at: string;
  category: ActivityCategory;
  // For converted commissions: tracks origin category for cross-filtering
  sourceCategory?: ActivityCategory;
  type: string;
  actor_name: string;
  actor_id: string;
  actor_code?: string;
  subject_name?: string;
  subject_id?: string;
  amount?: number;
  currency?: "CHF" | "LC";
  // For conversions: show both CHF and LC amounts
  secondaryAmount?: number;
  secondaryCurrency?: "CHF" | "LC";
  status?: string;
  // For split commissions: show original amount before split
  originalAmount?: number;
}
