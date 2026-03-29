import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { toast } from 'sonner';

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
      toast.success('Patient déplacé avec succès');
    },
    onError: (error) => {
      console.error('Move patient error:', error);
      toast.error('Erreur lors du déplacement du patient');
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
        throw new Error('Ce patient est déjà dans le pipeline');
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
      toast.success('Patient ajouté au pipeline');
    },
    onError: (error: Error) => {
      console.error('Add patient error:', error);
      toast.error(error.message || 'Erreur lors de l\'ajout du patient');
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
      toast.success('Patient retiré du pipeline');
    },
    onError: (error) => {
      console.error('Remove patient error:', error);
      toast.error('Erreur lors de la suppression');
    },
  });

  return {
    movePatient,
    addPatient,
    removePatient,
  };
}
