import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";

interface KPICardProps {
  title: string;
  value: ReactNode;
  icon?: LucideIcon;
  subtitle?: ReactNode;
  trend?: { value: string; positive: boolean };
  loading?: boolean;
  valueClassName?: string;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  loading = false,
  valueClassName
}: KPICardProps) {
  return (
    <Card className="min-h-[120px]">
      <CardContent className="pt-6 h-full flex flex-col">
        <div className="flex items-start justify-between flex-1">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">
              {title}
            </p>
            {loading ? (
              <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
            ) : (
              <p className={cn(
                "text-lg sm:text-xl md:text-2xl font-semibold text-foreground",
                "break-words line-clamp-2 leading-tight",
                valueClassName
              )}>
                {value}
              </p>
            )}
            {trend && !loading && (
              <p className={cn(
                "text-xs font-medium",
                trend.positive ? "text-success" : "text-destructive"
              )}>
                {trend.value}
              </p>
            )}
          </div>
          {Icon && (
            <div className="rounded-full bg-primary/10 p-3 ml-3 flex-shrink-0">
              <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
          )}
        </div>
        {subtitle && !loading && (
          <p className="text-xs text-muted-foreground mt-auto pt-2 line-clamp-2">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
