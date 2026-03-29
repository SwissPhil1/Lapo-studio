import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { checkPayoutProfileStatus, formatMissingFields } from "@/shared/lib/payoutProfile";

interface PayoutProfileIndicatorProps {
  referrerId: string;
  size?: "sm" | "md";
}

export function PayoutProfileIndicator({ referrerId, size = "sm" }: PayoutProfileIndicatorProps) {
  const { data: status } = useQuery({
    queryKey: ["payout-profile-status", referrerId],
    queryFn: () => checkPayoutProfileStatus(referrerId),
    enabled: !!referrerId,
  });

  if (!status) return null;

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  if (status.isComplete) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <CheckCircle2 className={`${iconSize} text-green-600`} />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">Informations bancaires complètes</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertCircle className={`${iconSize} text-amber-600`} />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm font-medium mb-1">Informations bancaires incomplètes</p>
          <p className="text-xs text-muted-foreground">
            Informations manquantes: {formatMissingFields(status.missingFields)}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
