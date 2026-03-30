import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { checkPayoutProfileStatus, formatMissingFields } from "@/shared/lib/payoutProfile";
import { useTranslation } from "react-i18next";

interface PayoutProfileIndicatorProps {
  referrerId: string;
  size?: "sm" | "md";
}

export function PayoutProfileIndicator({ referrerId, size = "sm" }: PayoutProfileIndicatorProps) {
  const { t } = useTranslation(['common']);
  const { data: status } = useQuery({
    queryKey: ["payout-profile-status", referrerId],
    queryFn: () => checkPayoutProfileStatus(referrerId),
    enabled: !!referrerId,
  });

  if (!status) return null;

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  if (status.isComplete) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <CheckCircle2 className={`${iconSize} text-green-600`} />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{t('common:bankInfoComplete')}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <AlertCircle className={`${iconSize} text-amber-600`} />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-sm font-medium mb-1">{t('common:bankInfoIncomplete')}</p>
        <p className="text-xs text-muted-foreground">
          {t('common:missingInfo', { fields: formatMissingFields(status.missingFields) })}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
