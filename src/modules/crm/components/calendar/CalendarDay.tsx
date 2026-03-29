import { cn } from '@/shared/lib/utils';
import { format, isToday, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarBookingItem } from './CalendarBookingItem';
import type { CalendarBooking } from '@/shared/hooks/useCalendarBookings';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CalendarDayProps {
  date: Date;
  currentMonth: Date;
  bookings: CalendarBooking[];
  variant: 'month' | 'week';
}

const MAX_VISIBLE_BOOKINGS = 3;

export function CalendarDay({ date, currentMonth, bookings, variant }: CalendarDayProps) {
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isCurrentDay = isToday(date);
  const hasMoreBookings = bookings.length > MAX_VISIBLE_BOOKINGS;
  const visibleBookings = variant === 'month' ? bookings.slice(0, MAX_VISIBLE_BOOKINGS) : bookings;
  const hiddenCount = bookings.length - MAX_VISIBLE_BOOKINGS;

  if (variant === 'week') {
    return (
      <div className="flex flex-col h-full min-h-[200px] border-r border-border last:border-r-0">
        <div className={cn(
          "text-center py-2 border-b border-border font-medium text-sm",
          isCurrentDay && "bg-primary text-primary-foreground"
        )}>
          <span className="block text-xs text-muted-foreground">
            {format(date, 'EEE', { locale: fr })}
          </span>
          <span>{format(date, 'd')}</span>
        </div>
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1.5">
            {bookings.map((booking) => (
              <CalendarBookingItem 
                key={booking.id} 
                booking={booking} 
                variant="detailed" 
              />
            ))}
            {bookings.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Aucun RDV
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-[100px] p-1 border-b border-r border-border",
      !isCurrentMonth && "bg-muted/30"
    )}>
      <div className={cn(
        "text-right mb-1",
        !isCurrentMonth && "text-muted-foreground"
      )}>
        <span className={cn(
          "inline-flex items-center justify-center w-6 h-6 text-sm rounded-full",
          isCurrentDay && "bg-primary text-primary-foreground font-semibold"
        )}>
          {format(date, 'd')}
        </span>
      </div>
      
      <div className="space-y-0.5">
        {visibleBookings.map((booking) => (
          <CalendarBookingItem 
            key={booking.id} 
            booking={booking} 
            variant="compact" 
          />
        ))}
        
        {hasMoreBookings && variant === 'month' && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full text-left px-1.5 py-0.5 rounded text-xs text-muted-foreground hover:bg-accent transition-colors">
                +{hiddenCount} autres
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2" align="start">
              <p className="font-medium text-sm mb-2">
                {format(date, 'd MMMM yyyy', { locale: fr })}
              </p>
              <ScrollArea className="max-h-60">
                <div className="space-y-1">
                  {bookings.map((booking) => (
                    <CalendarBookingItem 
                      key={booking.id} 
                      booking={booking} 
                      variant="detailed" 
                    />
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
