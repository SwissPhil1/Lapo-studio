import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/shared/lib/constants';
import { fr } from 'date-fns/locale';
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

const TASK_TYPE_LABELS: Record<string, string> = {
  overdue_recall: 'Rappel',
  dormant: 'Patient inactif',
  no_show_followup: 'Suivi absence',
  manual: 'Suivi manuel',
  cancelled_followup: 'Suivi annulation',
};

function getActionRequiredInfo(
  activeTask: ActiveTask | null,
  recallStatus: RecallStatus,
  recallContext?: RecallContext
): { 
  label: string; 
  sublabel?: string; 
  variant: 'urgent' | 'warning' | 'info' | 'none';
  tooltip?: string;
} {
  // Priority 1: Active task
  if (activeTask) {
    const typeLabel = TASK_TYPE_LABELS[activeTask.task_type] || activeTask.task_type;
    const dueLabel = activeTask.due_date 
      ? format(parseISO(activeTask.due_date), 'd MMM', { locale: fr })
      : null;
    
    const isOverdue = activeTask.due_date && parseISO(activeTask.due_date) < new Date();
    
    return {
      label: typeLabel,
      sublabel: dueLabel ?? undefined,
      variant: isOverdue ? 'urgent' : 'warning',
      tooltip: `Tâche ${typeLabel.toLowerCase()} ${isOverdue ? 'en retard' : 'à traiter'}${recallContext?.treatmentType ? ` (${recallContext.treatmentType})` : ''}`
    };
  }

  // Priority 2: No task but overdue recall → suggest creating task
  if (recallStatus === 'overdue') {
    return {
      label: 'Rappel à créer',
      sublabel: recallContext?.treatmentType ?? undefined,
      variant: 'warning',
      tooltip: `Patient en retard de rappel${recallContext?.daysOverdue ? ` (+${recallContext.daysOverdue}j)` : ''}. Créez une tâche de suivi.`
    };
  }

  // Priority 3: Due soon
  if (recallStatus === 'due_soon') {
    return {
      label: 'Rappel bientôt',
      sublabel: recallContext?.treatmentType ?? undefined,
      variant: 'info',
      tooltip: 'Le rappel de ce patient arrive bientôt. Anticipez le contact.'
    };
  }

  // No action required
  return {
    label: '-',
    variant: 'none'
  };
}

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
  const nextAppt = patient.upcomingBookings[0]?.booking_date;
  
  const hasAnySignal = patient.hasNoShow || patient.hasUnprocessedBooking || patient.referral;
  
  const actionInfo = getActionRequiredInfo(patient.activeTask, recallStatus, recallContext);

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
                  <p className="font-semibold">Historique no-show</p>
                  <p className="text-xs text-muted-foreground">
                    Ce patient a manqué un rendez-vous par le passé. Pensez à confirmer ses prochains RDV.
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
                  <p className="font-semibold">RDV non traité</p>
                  <p className="text-xs text-muted-foreground">
                    Ce patient a un rendez-vous passé encore marqué comme 'confirmé'. Marquez-le comme terminé ou non présenté.
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
                  <p className="font-semibold">Parrainé par {patient.referral.referrer_name || patient.referral.referrer_code}</p>
                  <p className="text-xs text-muted-foreground">
                    Ce patient a été référé. N'oubliez pas de remercier le parrain après le premier RDV.
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
        {nextAppt ? format(parseISO(nextAppt), 'd MMM yyyy', { locale: fr }) : '-'}
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
