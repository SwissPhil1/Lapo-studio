import * as React from 'react';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckCircle, Clock, AlertTriangle, AlertCircle, MessageCircle } from 'lucide-react';

export type RecallStatus = 'scheduled' | 'on_track' | 'due_soon' | 'overdue' | 'in_followup' | null;

interface RecallStatusBadgeProps {
  status: RecallStatus;
  daysOverdue?: number;
  treatmentType?: string | null;
  lastTreatmentDate?: Date | null;
  recallIntervalDays?: number;
  className?: string;
}

const statusClassNames = {
  scheduled: 'bg-success/10 text-success border-success/20',
  on_track: 'bg-primary/10 text-primary border-primary/20',
  due_soon: 'bg-warning/10 text-warning border-warning/20',
  overdue: 'bg-destructive/10 text-destructive border-destructive/20',
  in_followup: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

const statusIcons = {
  scheduled: CheckCircle,
  on_track: Clock,
  due_soon: AlertTriangle,
  overdue: AlertCircle,
  in_followup: MessageCircle,
};

const statusLabelKeys: Record<string, string> = {
  scheduled: 'scheduled',
  on_track: 'onTrack',
  due_soon: 'dueSoon',
  overdue: 'overdue',
  in_followup: 'inFollowup',
};

export const RecallStatusBadge = React.forwardRef<HTMLSpanElement, RecallStatusBadgeProps>(
  ({ status, daysOverdue, treatmentType, lastTreatmentDate, recallIntervalDays, className }, ref) => {
    const { t, i18n } = useTranslation(['patientDetail']);
    const dateLocale = i18n.language === 'fr' ? frLocale : enUS;

    if (!status) return null;

    const Icon = statusIcons[status];
    const statusClassName = statusClassNames[status];

    // Build the badge label
    let label = t(`patientDetail:recall.${statusLabelKeys[status]}`);

    // For overdue and due_soon with treatment type, show enriched label
    if ((status === 'overdue' || status === 'due_soon') && treatmentType) {
      if (status === 'overdue' && daysOverdue !== undefined && daysOverdue > 0) {
        label = `${treatmentType} ${t('patientDetail:recall.daysShort', { days: daysOverdue })}`;
      } else {
        label = treatmentType;
      }
    } else if (status === 'overdue' && daysOverdue !== undefined && daysOverdue > 0) {
      label = t('patientDetail:recall.daysShort', { days: daysOverdue });
    }

    // Build tooltip content for enriched context
    const hasEnrichedContext = treatmentType || lastTreatmentDate || recallIntervalDays;

    const badgeContent = (
      <Badge variant="outline" className={`${statusClassName} ${className || ''} whitespace-nowrap`} aria-label={label}>
        <Icon className="h-3 w-3 mr-1 flex-shrink-0" aria-hidden="true" />
        <span className="truncate max-w-[100px]">{label}</span>
      </Badge>
    );

    // If we have enriched context, wrap in tooltip
    if (hasEnrichedContext && (status === 'overdue' || status === 'due_soon')) {
      return (
        <span ref={ref}>
          <Tooltip>
            <TooltipTrigger asChild>
              {badgeContent}
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1.5 text-sm">
                {treatmentType && (
                  <p className="font-semibold">
                    {t('patientDetail:recall.lastTreatment', { type: treatmentType })}
                  </p>
                )}
                {lastTreatmentDate && (
                  <p className="text-muted-foreground">
                    {t('patientDetail:recall.date', { date: format(lastTreatmentDate, 'd MMMM yyyy', { locale: dateLocale }) })}
                  </p>
                )}
                {recallIntervalDays && (
                  <p className="text-muted-foreground">
                    {t('patientDetail:recall.recommendedInterval', { days: recallIntervalDays })}
                  </p>
                )}
                {status === 'overdue' && daysOverdue !== undefined && daysOverdue > 0 && (
                  <p className="text-destructive font-medium">
                    {t('patientDetail:recall.overdueDays', { days: daysOverdue })}
                  </p>
                )}
                {status === 'due_soon' && (
                  <p className="text-warning font-medium">
                    {t('patientDetail:recall.recallDueSoon')}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </span>
      );
    }

    return (
      <span ref={ref}>
        {badgeContent}
      </span>
    );
  }
);

RecallStatusBadge.displayName = 'RecallStatusBadge';
