import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { toast } from 'sonner';
import type { ConsentFormTemplate, ConsentFormResponse, ConsentFormField } from '@/shared/lib/consentFormTypes';

export function useConsentFormTemplates() {
  return useQuery<ConsentFormTemplate[]>({
    queryKey: ['consent-form-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consent_form_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') return []; // table doesn't exist yet
        throw error;
      }
      return (data || []) as ConsentFormTemplate[];
    },
  });
}

export function useCreateConsentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: {
      name: string;
      description?: string;
      fields: ConsentFormField[];
    }) => {
      const { data, error } = await supabase
        .from('consent_form_templates')
        .insert({
          name: template.name,
          description: template.description || null,
          fields: template.fields,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consent-form-templates'] });
      toast.success('Consent form template created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useConsentFormResponses(patientId?: string) {
  return useQuery<ConsentFormResponse[]>({
    queryKey: ['consent-form-responses', patientId],
    queryFn: async () => {
      let query = supabase
        .from('consent_form_responses')
        .select('*, consent_form_templates(name, description, fields), patients(first_name, last_name)')
        .order('created_at', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;
      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }
      return (data || []) as ConsentFormResponse[];
    },
    enabled: patientId ? true : true,
  });
}

export function useSendConsentForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      patientId,
      bookingId,
    }: {
      templateId: string;
      patientId: string;
      bookingId?: string;
    }) => {
      const { data, error } = await supabase
        .from('consent_form_responses')
        .insert({
          template_id: templateId,
          patient_id: patientId,
          booking_id: bookingId || null,
          responses: {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consent-form-responses'] });
      toast.success('Consent form sent');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
