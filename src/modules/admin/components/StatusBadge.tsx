import { cn } from "@/shared/lib/utils";
import { useTranslation } from "react-i18next";
import type { StatusEntityType } from "@/shared/lib/constants/statusTypes";
import { referralStatusVariants, commissionStatusVariants, batchStatusVariants, lapoCashStatusVariants } from "@/shared/lib/constants/statusVariants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface StatusBadgeProps {
  status: string;
  type?: StatusEntityType;
  className?: string;
}

export function StatusBadge({ status, type = "referral", className }: StatusBadgeProps) {
  const { t } = useTranslation();
  
  // Normalize status to lowercase
  const normalizedStatus = status?.toLowerCase() || "";

  // Get variant style based on entity type
  let variantStyle: string;
  if (type === "referral") {
    variantStyle = referralStatusVariants[normalizedStatus as keyof typeof referralStatusVariants] || "bg-muted text-muted-foreground border-border";
  } else if (type === "commission") {
    variantStyle = commissionStatusVariants[normalizedStatus as keyof typeof commissionStatusVariants] || "bg-muted text-muted-foreground border-border";
  } else if (type === "batch") {
    variantStyle = batchStatusVariants[normalizedStatus as keyof typeof batchStatusVariants] || "bg-muted text-muted-foreground border-border";
  } else if (type === "lapoCash") {
    variantStyle = lapoCashStatusVariants[normalizedStatus as keyof typeof lapoCashStatusVariants] || "bg-muted text-muted-foreground border-border";
  } else {
    variantStyle = "bg-muted text-muted-foreground border-border";
  }

  // Get translated label
  const translationKey = `status.${type}.${normalizedStatus}`;
  const displayLabel = t(translationKey, { defaultValue: status });

  // Get tooltip text for commission statuses
  const getTooltipText = () => {
    if (type !== "commission") return null;
    
    switch (normalizedStatus) {
      case "pending":
        return "Commission will be added to next payout batch";
      case "paid":
        return "Commission already included in a payout batch";
      case "cancelled":
      case "reversed":
        return "This commission is invalid or reversed";
      case "no_commission":
        return "This booking did not generate a commission";
      case "converted":
        return "This commission was converted to LAPO Cash";
      default:
        return null;
    }
  };

  const tooltipText = getTooltipText();

  const badge = (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantStyle,
        className
      )}
    >
      {displayLabel}
    </span>
  );

  if (tooltipText) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{badge}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
