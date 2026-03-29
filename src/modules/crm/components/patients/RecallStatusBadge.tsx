import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
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

const statusConfig = {
  scheduled: {
    label: 'Planifié',
    icon: CheckCircle,
    className: 'bg-success/10 text-success border-success/20',
  },
  on_track: {
    label: 'À jour',
    icon: Clock,
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  due_soon: {
    label: 'Bientôt dû',
    icon: AlertTriangle,
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  overdue: {
    label: 'En retard',
    icon: AlertCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  in_followup: {
    label: 'En suivi',
    icon: MessageCircle,
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
};

export const RecallStatusBadge = React.forwardRef<HTMLSpanElement, RecallStatusBadgeProps>(
  ({ status, daysOverdue, treatmentType, lastTreatmentDate, recallIntervalDays, className }, ref) => {
    if (!status) return null;

    const config = statusConfig[status];
    const Icon = config.icon;

    // Build the badge label
    let label = config.label;
    
    // For overdue and due_soon with treatment type, show enriched label
    if ((status === 'overdue' || status === 'due_soon') && treatmentType) {
      if (status === 'overdue' && daysOverdue !== undefined && daysOverdue > 0) {
        label = `${treatmentType} +${daysOverdue}j`;
      } else {
        label = treatmentType;
      }
    } else if (status === 'overdue' && daysOverdue !== undefined && daysOverdue > 0) {
      // Fallback: show days only if no treatment type
      label = `+${daysOverdue}j`;
    }

    // Build tooltip content for enriched context
    const hasEnrichedContext = treatmentType || lastTreatmentDate || recallIntervalDays;
    
    const badgeContent = (
      <Badge variant="outline" className={`${config.className} ${className || ''} whitespace-nowrap`}>
        <Icon className="h-3 w-3 mr-1 flex-shrink-0" />
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
                    Dernier traitement : {treatmentType}
                  </p>
                )}
                {lastTreatmentDate && (
                  <p className="text-muted-foreground">
                    Date : {format(lastTreatmentDate, 'd MMMM yyyy', { locale: fr })}
                  </p>
                )}
                {recallIntervalDays && (
                  <p className="text-muted-foreground">
                    Intervalle recommandé : {recallIntervalDays} jours
                  </p>
                )}
                {status === 'overdue' && daysOverdue !== undefined && daysOverdue > 0 && (
                  <p className="text-destructive font-medium">
                    En retard de {daysOverdue} jour{daysOverdue > 1 ? 's' : ''}
                  </p>
                )}
                {status === 'due_soon' && (
                  <p className="text-warning font-medium">
                    Rappel bientôt dû
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