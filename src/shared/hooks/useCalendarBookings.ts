import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns';

export interface CalendarBooking {
  id: string;
  booking_date: string;
  service: string;
  status: string | null;
  booking_value: number;
  patient_id: string;
  patient_name: string;
  patient_email: string | null;
  rescheduled_to_booking_id: string | null;
}

export interface BookingsByDate {
  [date: string]: CalendarBooking[];
}

export function useCalendarBookings(currentDate: Date, view: 'month' | 'week') {
  // Calculate date range based on view
  const startDate = view === 'month' 
    ? startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    : startOfWeek(currentDate, { weekStartsOn: 1 });
  
  const endDate = view === 'month'
    ? endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    : endOfWeek(currentDate, { weekStartsOn: 1 });

  const query = useQuery({
    queryKey: ['calendar-bookings', format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          service,
          status,
          booking_value,
          patient_id,
          rescheduled_to_booking_id,
          patients!bookings_patient_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .gte('booking_date', format(startDate, 'yyyy-MM-dd'))
        .lte('booking_date', format(endDate, 'yyyy-MM-dd'))
        .eq('is_test', false)
        .order('booking_date', { ascending: true });

      if (error) throw error;

      // Transform and group by date (extract just the date part from timestamp)
      const bookingsByDate: BookingsByDate = {};
      
      data?.forEach((booking: any) => {
        // Extract date part only (first 10 chars: yyyy-MM-dd)
        const dateKey = booking.booking_date.substring(0, 10);
        const transformed: CalendarBooking = {
          id: booking.id,
          booking_date: booking.booking_date,
          service: booking.service,
          status: booking.status,
          booking_value: booking.booking_value,
          patient_id: booking.patient_id,
          patient_name: `${booking.patients?.first_name || ''} ${booking.patients?.last_name || ''}`.trim() || 'Patient inconnu',
          patient_email: booking.patients?.email || null,
          rescheduled_to_booking_id: booking.rescheduled_to_booking_id || null,
        };

        if (!bookingsByDate[dateKey]) {
          bookingsByDate[dateKey] = [];
        }
        bookingsByDate[dateKey].push(transformed);
      });

      return bookingsByDate;
    },
  });

  return {
    bookingsByDate: query.data || {},
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
