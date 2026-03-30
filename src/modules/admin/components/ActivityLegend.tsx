import { useTranslation } from "react-i18next";
import { activityStatusConfig, type ReferrerActivityStatus } from "@/shared/lib/referrerActivity";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface ActivityLegendProps {
  compact?: boolean;
}

export function ActivityLegend({ compact = true }: ActivityLegendProps) {
  const { t } = useTranslation(["common"]);

  const statuses: ReferrerActivityStatus[] = ["active", "dormant", "cold"];

  const labels: Record<string, string> = {
    active: t("common:activityActive"),
    dormant: t("common:activityDormant"),
    cold: t("common:activityCold"),
  };

  const descriptions: Record<string, string> = {
    active: t("common:activityActiveTooltip"),
    dormant: t("common:activityDormantTooltip"),
    cold: t("common:activityColdTooltip"),
  };

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <HelpCircle className="h-4 w-4" />
            <span className="text-xs">{t("common:activityLegend")}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs p-3">
          <div className="space-y-2">
            {statuses.map((status) => (
              <div key={status} className="flex items-start gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: activityStatusConfig[status].color }}
                />
                <div>
                  <p className="text-sm font-medium">{labels[status]}</p>
                  <p className="text-xs text-muted-foreground">{descriptions[status]}</p>
                </div>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-4 text-xs">
      {statuses.map((status) => (
        <div key={status} className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: activityStatusConfig[status].color }}
          />
          <span className="text-muted-foreground">{labels[status]}</span>
        </div>
      ))}
    </div>
  );
}
