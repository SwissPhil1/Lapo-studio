import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface MovePatientParams {
  pipelinePatientId: string;
  newStageId: string;
}

interface AddPatientParams {
  patientId: string;
  stageId: string;
  notes?: string;
  priority?: string;
}

export function usePipelineActions() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(['pipeline']);

  const movePatient = useMutation({
    mutationFn: async ({ pipelinePatientId, newStageId }: MovePatientParams) => {
      const { error } = await supabase
        .from('pipeline_patients')
        .update({
          stage_id: newStageId,
          entered_at: new Date().toISOString()
        })
        .eq('id', pipelinePatientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-patients'] });
      toast.success(t('pipeline:patientMoved'));
    },
    onError: (error) => {
      console.error('Move patient error:', error);
      toast.error(t('pipeline:moveError'));
    },
  });

  const addPatient = useMutation({
    mutationFn: async ({ patientId, stageId, notes, priority }: AddPatientParams) => {
      // Check if patient already in pipeline
      const { data: existing } = await supabase
        .from('pipeline_patients')
        .select('id')
        .eq('patient_id', patientId)
        .maybeSingle();

      if (existing) {
        throw new Error(t('pipeline:alreadyInPipeline'));
      }

      const { error } = await supabase
        .from('pipeline_patients')
        .insert({
          patient_id: patientId,
          stage_id: stageId,
          notes,
          priority,
          entered_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-patients'] });
      toast.success(t('pipeline:patientAdded'));
    },
    onError: (error: Error) => {
      console.error('Add patient error:', error);
      toast.error(error.message || t('pipeline:addError'));
    },
  });

  const removePatient = useMutation({
    mutationFn: async (pipelinePatientId: string) => {
      const { error } = await supabase
        .from('pipeline_patients')
        .delete()
        .eq('id', pipelinePatientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-patients'] });
      toast.success(t('pipeline:patientRemoved'));
    },
    onError: (error) => {
      console.error('Remove patient error:', error);
      toast.error(t('pipeline:removeError'));
    },
  });

  return {
    movePatient,
    addPatient,
    removePatient,
  };
}
