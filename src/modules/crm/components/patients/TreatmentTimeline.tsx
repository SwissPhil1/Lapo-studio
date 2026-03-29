import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { CheckCircle, Calendar, Clock, XCircle, UserX, RefreshCw, ArrowRight } from 'lucide-react';
import { RecallStatusBadge, type RecallStatus } from './RecallStatusBadge';
import { getStatusLabel, getStatusColors, BOOKING_STATUS } from '@/shared/lib/bookingStatus';

interface TreatmentAppointment {
  id: string;
  date: string;
  service: string;
  status: string;
  rescheduled_to_booking_id?: string | null;
}

interface TreatmentTimelineProps {
  treatmentType: string;
  appointments: TreatmentAppointment[];
  recallIntervalDays: number;
}

function getRecallStatus(
  lastTreatmentDate: Date | null,
  recallIntervalDays: number,
  nextBookingDate: Date | null
): RecallStatus {
  if (!lastTreatmentDate) return null;
  
  const today = new Date();
  const nextDueDate = addDays(lastTreatmentDate, recallIntervalDays);
  const daysUntilDue = differenceInDays(nextDueDate, today);
  
  if (nextBookingDate && nextBookingDate > today) {
    return 'scheduled';
  }
  
  if (daysUntilDue > 30) return 'on_track';
  if (daysUntilDue > 0) return 'due_soon';
  return 'overdue';
}

export function TreatmentTimeline({ 
  treatmentType, 
  appointments, 
  recallIntervalDays 
}: TreatmentTimelineProps) {
  const today = new Date();
  
  // Split appointments into past (completed/scheduled) and future
  const pastAppointments = appointments
    .filter(a => (a.status === 'completed' || a.status === 'scheduled') && parseISO(a.date) <= today)
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  
  const futureAppointments = appointments
    .filter(a => parseISO(a.date) > today)
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  
  const lastCompletedDate = pastAppointments.length > 0 
    ? parseISO(pastAppointments[0].date) 
    : null;
  
  const nextScheduledDate = futureAppointments.length > 0 
    ? parseISO(futureAppointments[0].date) 
    : null;
  
  const nextDueDate = lastCompletedDate 
    ? addDays(lastCompletedDate, recallIntervalDays) 
    : null;
  
  const recallStatus = getRecallStatus(lastCompletedDate, recallIntervalDays, nextScheduledDate);

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-foreground">{treatmentType}</h4>
        <RecallStatusBadge status={recallStatus} />
      </div>
      
      <div className="space-y-3">
        {/* Past Appointments */}
        {pastAppointments.slice(0, 3).map((apt, index) => {
          const statusColors = getStatusColors(apt.status);
          const isCompleted = apt.status === BOOKING_STATUS.COMPLETED;
          const isNoShow = apt.status === BOOKING_STATUS.NO_SHOW;
          const isCancelled = apt.status === BOOKING_STATUS.CANCELLED;
          const isRescheduled = apt.status === BOOKING_STATUS.RESCHEDULED;
          
          return (
            <div key={apt.id} className="flex items-center gap-3">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center ${statusColors.bg}`}>
                {isCompleted && <CheckCircle className={`h-3.5 w-3.5 ${statusColors.text}`} />}
                {isNoShow && <UserX className={`h-3.5 w-3.5 ${statusColors.text}`} />}
                {isCancelled && <XCircle className={`h-3.5 w-3.5 ${statusColors.text}`} />}
                {isRescheduled && <RefreshCw className={`h-3.5 w-3.5 ${statusColors.text}`} />}
                {!isCompleted && !isNoShow && !isCancelled && !isRescheduled && <CheckCircle className={`h-3.5 w-3.5 ${statusColors.text}`} />}
              </div>
              <div className="flex-1">
                <span className="text-sm text-foreground">
                  {format(parseISO(apt.date), 'MMM d, yyyy')}
                </span>
                <span className={`text-xs ml-2 ${statusColors.text}`}>
                  ({getStatusLabel(apt.status)})
                </span>
                {index === 0 && apt.status === BOOKING_STATUS.COMPLETED && (
                  <span className="text-xs text-muted-foreground ml-1">- Dernière visite</span>
                )}
                {isRescheduled && apt.rescheduled_to_booking_id && (
                  <span className="text-xs text-amber-600 ml-1 flex items-center gap-0.5">
                    <ArrowRight className="h-3 w-3" />
                    Reporté
                  </span>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Next Scheduled */}
        {nextScheduledDate && (
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1">
              <span className="text-sm text-foreground">
                {format(nextScheduledDate, 'MMM d, yyyy')}
              </span>
              <span className="text-xs text-primary ml-2">(Planifié)</span>
            </div>
          </div>
        )}
        
        {/* Next Due Date - Only show for due_soon, not overdue (badge is enough) */}
        {nextDueDate && !nextScheduledDate && recallStatus === 'due_soon' && (
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-warning/10 flex items-center justify-center">
              <Clock className="h-3.5 w-3.5 text-warning" />
            </div>
            <div className="flex-1">
              <span className="text-sm text-warning">
                {format(nextDueDate, 'MMM d, yyyy')}
              </span>
              <span className="text-xs ml-2 text-warning">
                (À venir)
              </span>
            </div>
          </div>
        )}
        
        {pastAppointments.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun traitement terminé</p>
        )}
      </div>
    </div>
  );
}
