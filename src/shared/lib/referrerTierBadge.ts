import { cn } from "@/shared/lib/utils";

export type TierCode = "standard" | "premium" | "vip" | string;

interface TierBadgeStyles {
  className: string;
  label: string;
}

/**
 * Returns the appropriate styling for a referrer tier badge.
 * - STANDARD: Gray badge
 * - PREMIUM: Blue badge
 * - VIP: Gold/Purple gradient badge
 */
export function getTierBadgeStyles(tierCode: string | null | undefined, tierName?: string | null): TierBadgeStyles {
  const code = (tierCode || "standard").toLowerCase();
  const label = tierName || tierCode?.toUpperCase() || "STANDARD";

  switch (code) {
    case "vip":
      return {
        className: "bg-gradient-to-r from-purple-500 to-amber-500 text-white border-transparent",
        label,
      };
    case "premium":
      return {
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800",
        label,
      };
    case "standard":
    default:
      return {
        className: "bg-secondary text-secondary-foreground",
        label,
      };
  }
}

/**
 * Returns complete badge className including base styles.
 */
export function getTierBadgeClassName(tierCode: string | null | undefined): string {
  const { className } = getTierBadgeStyles(tierCode);
  return cn(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium cursor-help",
    className
  );
}
