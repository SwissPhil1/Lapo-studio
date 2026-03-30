import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/shared/lib/constants';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Gift, Clock, AlertTriangle, Calendar, AlertCircle } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RecallStatusBadge, type RecallStatus } from '@/modules/crm/components/patients/RecallStatusBadge';
import type { RecallContext } from '@/shared/lib/recallUtils';

interface ActiveTask {
  id: string;
  task_type: string;
  due_date: string | null;
  status: string;
}

interface PipelineStage {
  name: string;
  color: string | null;
}

interface PatientWithDetails {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  tags: string[] | null;
  created_at: string;
  referral?: {
    referrer_code: string;
    referrer_name?: string;
  } | null;
  pastBookings: { booking_date: string; status: string; service?: string; booking_value?: number }[];
  upcomingBookings: { booking_date: string }[];
  hasUnprocessedBooking: boolean;
  hasNoShow: boolean;
  activeTask: ActiveTask | null;
  pipelineStage: PipelineStage | null;
  totalValue: number;
}

interface PatientTableRowProps {
  patient: PatientWithDetails;
  recallStatus: RecallStatus;
  recallDueDate?: Date | null;
  daysOverdue?: number;
  recallContext?: RecallContext;
  onClick: (patientId: string) => void;
  isSelected?: boolean;
  onSelectChange?: (patientId: string, checked: boolean) => void;
  showCheckbox?: boolean;
}

const TASK_TYPE_KEYS: Record<string, string> = {
  overdue_recall: 'recall',
  dormant: 'dormant',
  no_show_followup: 'noShowFollowup',
  manual: 'manual',
  cancelled_followup: 'cancelledFollowup',
};

export function PatientTableRow({
  patient,
  recallStatus,
  recallDueDate: _recallDueDate,
  daysOverdue,
  recallContext,
  onClick,
  isSelected = false,
  onSelectChange,
  showCheckbox = false,
}: PatientTableRowProps) {
  const { t, i18n } = useTranslation(['patients', 'common']);
  const dateLocale = i18n.language === 'fr' ? frLocale : enUS;
  const nextAppt = patient.upcomingBookings[0]?.booking_date;

  const hasAnySignal = patient.hasNoShow || patient.hasUnprocessedBooking || patient.referral;

  // Compute action required info
  const actionInfo = (() => {
    const activeTask = patient.activeTask;
    if (activeTask) {
      const typeKey = TASK_TYPE_KEYS[activeTask.task_type] || activeTask.task_type;
      const typeLabel = TASK_TYPE_KEYS[activeTask.task_type] ? t(`patients:actions.${typeKey}`) : activeTask.task_type;
      const dueLabel = activeTask.due_date
        ? format(parseISO(activeTask.due_date), 'd MMM', { locale: dateLocale })
        : null;
      const isOverdue = activeTask.due_date && parseISO(activeTask.due_date) < new Date();
      return {
        label: typeLabel,
        sublabel: dueLabel ?? undefined,
        variant: (isOverdue ? 'urgent' : 'warning') as 'urgent' | 'warning' | 'info' | 'none',
        tooltip: t('patients:actions.taskTooltip', { type: typeLabel.toLowerCase(), status: isOverdue ? t('patients:actions.taskOverdue') : t('patients:actions.taskToDo') }) + (recallContext?.treatmentType ? ` (${recallContext.treatmentType})` : ''),
      };
    }
    if (recallStatus === 'overdue') {
      return {
        label: t('patients:actions.createRecall'),
        sublabel: recallContext?.treatmentType ?? undefined,
        variant: 'warning' as const,
        tooltip: t('patients:actions.overdueRecallTip', { days: recallContext?.daysOverdue ?? '?' }),
      };
    }
    if (recallStatus === 'due_soon') {
      return {
        label: t('patients:actions.recallSoon'),
        sublabel: recallContext?.treatmentType ?? undefined,
        variant: 'info' as const,
        tooltip: t('patients:actions.recallSoonTip'),
      };
    }
    return { label: '-', variant: 'none' as const };
  })();

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <TableRow 
      className={`cursor-pointer hover:bg-muted/50 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
      onClick={() => onClick(patient.id)}
    >
      {/* Checkbox */}
      {showCheckbox && (
        <TableCell className="w-[50px]" onClick={handleCheckboxClick}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectChange?.(patient.id, checked === true)}
          />
        </TableCell>
      )}

      {/* Patient name + Pipeline Stage (merged) */}
      <TableCell className="font-medium">
        <div className="flex flex-col gap-1">
          <span>{patient.last_name} {patient.first_name}</span>
          <div className="flex flex-wrap items-center gap-1">
            {/* Pipeline stage as inline badge */}
            {patient.pipelineStage && (
              <span 
                className="px-1.5 py-0.5 text-[10px] rounded font-medium"
                style={{ 
                  backgroundColor: patient.pipelineStage.color ? `${patient.pipelineStage.color}20` : 'hsl(var(--muted))',
                  color: patient.pipelineStage.color || 'hsl(var(--muted-foreground))',
                }}
              >
                {patient.pipelineStage.name}
              </span>
            )}
            {/* Tags */}
            {patient.tags && patient.tags.length > 0 && (
              <>
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground">
                  {patient.tags[0]}
                </span>
                {patient.tags.length > 1 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{patient.tags.length - 1}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </TableCell>

      {/* Signals/Indicators (without active task icon - moved to Action requise) */}
      <TableCell>
        <div className="flex items-center gap-1">
          {patient.hasNoShow && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Clock className="h-4 w-4 text-warning" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">{t('patients:signals.noShowHistory')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('patients:signals.noShowDesc')}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
          {patient.hasUnprocessedBooking && (
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertTriangle className="h-4 w-4 text-warning" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">{t('patients:signals.unprocessedBooking')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('patients:signals.unprocessedBookingDesc')}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
          {patient.referral && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Gift className="h-4 w-4 text-primary" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">{t('patients:signals.referredBy', { name: patient.referral.referrer_name || patient.referral.referrer_code })}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('patients:signals.referredByDesc')}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
          {!hasAnySignal && (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      </TableCell>

      {/* Action requise (merged Tâche active + context) */}
      <TableCell>
        {actionInfo.variant !== 'none' ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-default">
                {actionInfo.variant === 'urgent' && (
                  <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                )}
                {actionInfo.variant === 'warning' && (
                  <Calendar className="h-3.5 w-3.5 text-warning flex-shrink-0" />
                )}
                {actionInfo.variant === 'info' && (
                  <Calendar className="h-3.5 w-3.5 text-info flex-shrink-0" />
                )}
                <div className="flex flex-col">
                  <span className={`text-sm font-medium ${
                    actionInfo.variant === 'urgent' ? 'text-destructive' :
                    actionInfo.variant === 'warning' ? 'text-warning' :
                    'text-info'
                  }`}>
                    {actionInfo.label}
                  </span>
                  {actionInfo.sublabel && (
                    <span className="text-xs text-muted-foreground">
                      {actionInfo.sublabel}
                    </span>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">{actionInfo.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Next appointment */}
      <TableCell className="text-muted-foreground">
        {nextAppt ? format(parseISO(nextAppt), 'd MMM yyyy', { locale: dateLocale }) : '-'}
      </TableCell>

      {/* Recall status (enriched badge) */}
      <TableCell>
        <RecallStatusBadge 
          status={recallStatus} 
          daysOverdue={daysOverdue}
          treatmentType={recallContext?.treatmentType}
          lastTreatmentDate={recallContext?.lastTreatmentDate}
          recallIntervalDays={recallContext?.recallIntervalDays}
        />
      </TableCell>

      {/* Total value */}
      <TableCell className="text-right">
        {patient.totalValue > 0 ? (
          <span className="font-medium text-foreground">
            {formatCurrency(patient.totalValue)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
    </TableRow>
  );
}
