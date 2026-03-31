import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';

export interface ThreadMessage {
  id: string;
  patient_id: string;
  channel: 'email' | 'sms' | 'phone' | 'whatsapp';
  direction: 'inbound' | 'outbound';
  subject: string | null;
  message_preview: string | null;
  full_message: string | null;
  status: string | null;
  sent_at: string | null;
  created_at: string;
}

export function useCommunicationThread(patientId: string | undefined) {
  return useQuery<ThreadMessage[]>({
    queryKey: ['communication-thread', patientId],
    queryFn: async () => {
      if (!patientId) return [];

      const { data, error } = await supabase
        .from('crm_communication_logs')
        .select('id, patient_id, channel, direction, subject, message_preview, full_message, status, sent_at, created_at')
        .eq('patient_id', patientId)
        .order('sent_at', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return (data || []) as ThreadMessage[];
    },
    enabled: !!patientId,
  });
}
