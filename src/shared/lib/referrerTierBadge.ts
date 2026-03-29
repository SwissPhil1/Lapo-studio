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
        className: "bg-gradient-to-r from-wow-violet to-wow-coral text-white border-transparent",
        label,
      };
    case "premium":
      return {
        className: "bg-info/15 text-info border-info/30",
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
