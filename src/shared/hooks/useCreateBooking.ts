import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { fireBookingWebhook } from '@/shared/lib/webhooks';
import { toast } from 'sonner';

interface CreateBookingInput {
  patient_id: string;
  service: string;
  booking_date: string;
  booking_time?: string;
  value?: number;
  notes?: string;
  patient_name?: string;
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          patient_id: input.patient_id,
          service: input.service,
          booking_date: input.booking_date,
          status: 'confirmed',
          value: input.value || 0,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Fire Zapier webhook for ClinicMinds sync (non-blocking)
      fireBookingWebhook({
        patient_id: input.patient_id,
        service: input.service,
        booking_date: input.booking_date,
        booking_time: input.booking_time,
        notes: input.notes,
        patient_name: input.patient_name,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Booking created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
