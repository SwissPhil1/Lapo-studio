import { useState, useMemo } from 'react';
import { cn } from '@/shared/lib/utils';
import { 
  format, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDay } from './CalendarDay';
import { useCalendarBookings, type BookingsByDate } from '@/shared/hooks/useCalendarBookings';
import { BOOKING_STATUS_LABELS_FR, BOOKING_STATUS_COLORS } from '@/shared/lib/bookingStatus';

interface InternalCalendarProps {
  defaultView?: 'month' | 'week';
  className?: string;
}

const WEEKDAY_HEADERS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// Status filter configuration
const STATUS_FILTERS = [
  { key: 'scheduled', label: 'Planifié', colorClass: 'bg-primary' },
  { key: 'completed', label: 'Complété', colorClass: 'bg-green-500' },
  { key: 'no_show', label: 'Absent', colorClass: 'bg-destructive' },
  { key: 'rescheduled', label: 'Reporté', colorClass: 'bg-amber-500' },
  { key: 'cancelled', label: 'Annulé', colorClass: 'bg-muted-foreground' },
] as const;

// Default: only show scheduled and completed
const DEFAULT_VISIBLE_STATUSES = new Set(['scheduled', 'completed']);

export function InternalCalendar({ defaultView = 'month', className }: InternalCalendarProps) {
  const [view, setView] = useState<'month' | 'week'>(defaultView);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visibleStatuses, setVisibleStatuses] = useState<Set<string>>(DEFAULT_VISIBLE_STATUSES);
  
  const { bookingsByDate, isLoading, error, refetch } = useCalendarBookings(currentDate, view);

  // Filter bookings based on selected statuses
  const filteredBookingsByDate = useMemo(() => {
    const filtered: BookingsByDate = {};
    Object.entries(bookingsByDate).forEach(([date, bookings]) => {
      const filteredBookings = bookings.filter(b => 
        visibleStatuses.has(b.status || 'scheduled')
      );
      if (filteredBookings.length > 0) {
        filtered[date] = filteredBookings;
      }
    });
    return filtered;
  }, [bookingsByDate, visibleStatuses]);

  const toggleStatus = (status: string) => {
    setVisibleStatuses(prev => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const handlePrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calculate days to display
  const getDays = () => {
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
    
    // Month view: include days from prev/next month to fill the grid
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  const days = getDays();

  const getHeaderText = () => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: fr });
    }
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    return `${format(weekStart, 'd MMM', { locale: fr })} - ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`;
  };

  return (
    <div className={cn("flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleToday}>
            Aujourd'hui
          </Button>
        </div>

        <h2 className="text-lg font-semibold capitalize">
          {getHeaderText()}
        </h2>

        <div className="flex items-center gap-4">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Tabs value={view} onValueChange={(v) => setView(v as 'month' | 'week')}>
            <TabsList>
              <TabsTrigger value="month">Mois</TabsTrigger>
              <TabsTrigger value="week">Semaine</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-3 p-3 mx-4 mt-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <span className="text-destructive flex-1">Impossible de charger les rendez-vous</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="shrink-0">
            <RefreshCw className="h-3 w-3 mr-1" />
            Réessayer
          </Button>
        </div>
      )}

      {/* Calendar Grid */}
      {view === 'month' ? (
        <div className="flex-1 overflow-auto">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/50">
            {WEEKDAY_HEADERS.map((day) => (
              <div key={day} className="text-center py-2 text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          {/* Days grid */}
          <div className="grid grid-cols-7">
            {days.map((day) => (
              <CalendarDay
                key={day.toISOString()}
                date={day}
                currentMonth={currentDate}
                bookings={filteredBookingsByDate[format(day, 'yyyy-MM-dd')] || []}
                variant="month"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-7 h-full">
            {days.map((day) => (
              <CalendarDay
                key={day.toISOString()}
                date={day}
                currentMonth={currentDate}
                bookings={filteredBookingsByDate[format(day, 'yyyy-MM-dd')] || []}
                variant="week"
              />
            ))}
          </div>
        </div>
      )}

      {/* Interactive Status Filters */}
      <div className="flex items-center justify-center gap-2 p-3 border-t border-border bg-muted/30 text-xs flex-wrap">
        <span className="text-muted-foreground mr-2">Filtrer :</span>
        {STATUS_FILTERS.map(({ key, label, colorClass }) => {
          const isActive = visibleStatuses.has(key);
          return (
            <button
              key={key}
              onClick={() => toggleStatus(key)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-all",
                isActive 
                  ? "border-primary/50 bg-primary/10 text-foreground" 
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              <div className={cn(
                "w-3 h-3 rounded flex items-center justify-center",
                colorClass
              )}>
                {isActive && <Check className="h-2 w-2 text-white" />}
              </div>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
