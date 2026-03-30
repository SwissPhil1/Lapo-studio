import { cn } from '@/shared/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getStatusColors, getStatusLabel, BOOKING_STATUS } from '@/shared/lib/bookingStatus';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CalendarBooking } from '@/shared/hooks/useCalendarBookings';

interface CalendarBookingItemProps {
  booking: CalendarBooking;
  variant?: 'compact' | 'detailed';
}

export function CalendarBookingItem({ booking, variant = 'compact' }: CalendarBookingItemProps) {
  const { t } = useTranslation(['calendar']);
  const navigate = useNavigate();
  const colors = getStatusColors(booking.status || 'scheduled');
  const statusLabel = getStatusLabel(booking.status || 'scheduled');
  const isRescheduled = booking.status === BOOKING_STATUS.RESCHEDULED;

  const handleClick = () => {
    navigate(`/crm/patients/${booking.patient_id}`);
  };

  if (variant === 'compact') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className={cn(
              "w-full text-left px-1.5 py-0.5 rounded text-xs truncate transition-opacity hover:opacity-80",
              colors.bg,
              colors.text
            )}
          >
            {booking.patient_name}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{booking.patient_name}</p>
            <p className="text-muted-foreground">{booking.service}</p>
            <div className="flex items-center gap-2">
              <span className={cn("px-1.5 py-0.5 rounded text-xs", colors.bg, colors.text)}>
                {statusLabel}
              </span>
              {booking.booking_value > 0 && (
                <span className="text-xs text-muted-foreground">
                  CHF {booking.booking_value.toLocaleString()}
                </span>
              )}
            </div>
            {isRescheduled && booking.rescheduled_to_booking_id && (
              <p className="text-xs text-warning flex items-center gap-1">
                <ArrowRight className="h-3 w-3" />
                {t('calendar:appointmentPostponed')}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full text-left p-2 rounded-md border transition-all hover:shadow-sm",
        "bg-card hover:bg-accent/50",
        "border-l-4",
        booking.status === 'completed' && "border-l-success",
        booking.status === 'scheduled' && "border-l-primary",
        booking.status === 'cancelled' && "border-l-muted",
        booking.status === 'no_show' && "border-l-destructive",
        booking.status === 'rescheduled' && "border-l-warning",
        !booking.status && "border-l-primary"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{booking.patient_name}</p>
          <p className="text-xs text-muted-foreground truncate">{booking.service}</p>
        </div>
        <span className={cn("px-1.5 py-0.5 rounded text-xs shrink-0", colors.bg, colors.text)}>
          {statusLabel}
        </span>
      </div>
      {isRescheduled && booking.rescheduled_to_booking_id && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-warning">
          <ArrowRight className="h-3 w-3" />
          <span>{t('calendar:viewNewAppointment')}</span>
        </div>
      )}
    </button>
  );
}
