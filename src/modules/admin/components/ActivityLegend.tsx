import { useTranslation } from "react-i18next";
import { activityStatusConfig, type ReferrerActivityStatus } from "@/shared/lib/referrerActivity";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface ActivityLegendProps {
  compact?: boolean;
}

export function ActivityLegend({ compact = true }: ActivityLegendProps) {
  const { t, i18n } = useTranslation(["referrers"]);
  const isEnglish = i18n.language === "en";

  const statuses: ReferrerActivityStatus[] = ["active", "dormant", "cold"];

  const labels = {
    active: isEnglish ? "Active" : "Actif",
    dormant: isEnglish ? "Dormant" : "À relancer",
    cold: isEnglish ? "Inactive" : "Inactif",
  };

  const descriptions = {
    active: isEnglish 
      ? "Made a referral in the last 60 days" 
      : "A fait un parrainage dans les 60 derniers jours",
    dormant: isEnglish 
      ? "No referral in the last 2-6 months" 
      : "Aucun parrainage dans les 2-6 derniers mois",
    cold: isEnglish 
      ? "No referral in over 6 months" 
      : "Aucun parrainage depuis plus de 6 mois",
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <HelpCircle className="h-4 w-4" />
              <span className="text-xs">{isEnglish ? "Activity legend" : "Légende activité"}</span>
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
      </TooltipProvider>
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
