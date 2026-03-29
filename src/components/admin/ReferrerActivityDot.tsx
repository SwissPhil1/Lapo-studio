import { cn } from "@/shared/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getReferrerActivityStatus,
  activityStatusConfig,
  type ReferrerActivityStatus,
} from "@/shared/lib/referrerActivity";

interface ReferrerActivityDotProps {
  status?: ReferrerActivityStatus;
  lastReferralAt?: string | null;
  createdAt?: string;
  size?: 'sm' | 'md';
  showTooltip?: boolean;
  className?: string;
}

export function ReferrerActivityDot({
  status: providedStatus,
  lastReferralAt,
  createdAt,
  size = 'md',
  showTooltip = true,
  className,
}: ReferrerActivityDotProps) {
  // Compute status if not provided
  const status = providedStatus ||
    (createdAt && getReferrerActivityStatus({
      createdAt,
      lastReferralAt: lastReferralAt || null,
    }));

  if (!status) return null;

  const config = activityStatusConfig[status];
  const sizeClasses = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  const dot = (
    <div
      className={cn(
        sizeClasses,
        "rounded-full cursor-pointer transition-all duration-200 hover:brightness-110 animate-fade-in shadow-sm",
        className
      )}
      style={{ backgroundColor: config.color }}
    />
  );

  if (!showTooltip) return dot;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {dot}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
