import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Pause, Play, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PatientWorkflowsProps {
  patientId: string;
}

interface Enrollment {
  id: string;
  workflow_id: string;
  current_step: number;
  status: string;
  enrolled_at: string;
  next_action_at: string | null;
  workflow: {
    id: string;
    name: string;
  };
}

interface WorkflowStep {
  workflow_id: string;
}

export function PatientWorkflows({ patientId }: PatientWorkflowsProps) {
  const queryClient = useQueryClient();

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['patient-enrollments', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_workflow_enrollments')
        .select(`
          id,
          workflow_id,
          current_step,
          status,
          enrolled_at,
          next_action_at,
          workflow:crm_workflows(id, name)
        `)
        .eq('patient_id', patientId)
        .in('status', ['active', 'paused'])
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Enrollment[];
    },
  });

  const { data: stepsCounts } = useQuery({
    queryKey: ['workflow-steps-counts-patient'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_workflow_steps')
        .select('workflow_id');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      (data as WorkflowStep[]).forEach((step) => {
        counts[step.workflow_id] = (counts[step.workflow_id] || 0) + 1;
      });
      return counts;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('crm_workflow_enrollments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['patient-enrollments', patientId] });
      const messages: Record<string, string> = {
        paused: 'Workflow mis en pause',
        active: 'Workflow réactivé',
        cancelled: 'Workflow annulé',
      };
      toast.success(messages[status] || 'Statut mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-8 bg-muted rounded" />
      </div>
    );
  }

  if (!enrollments || enrollments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        <Zap className="h-4 w-4" />
        Workflows actifs
      </h3>
      
      {enrollments.map((enrollment) => {
        const totalSteps = stepsCounts?.[enrollment.workflow_id] || 0;
        
        return (
          <div
            key={enrollment.id}
            className="p-3 bg-muted/50 rounded-lg space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {enrollment.workflow?.name || 'Workflow'}
              </span>
              <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                {enrollment.status === 'active' ? 'Actif' : 'Pause'}
              </Badge>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Étape {enrollment.current_step}/{totalSteps}
              {enrollment.next_action_at && (
                <> • Prochaine action {formatDistanceToNow(new Date(enrollment.next_action_at), { 
                  addSuffix: true, 
                  locale: fr 
                })}</>
              )}
            </div>

            <div className="flex gap-1">
              {enrollment.status === 'active' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => updateStatusMutation.mutate({ id: enrollment.id, status: 'paused' })}
                >
                  <Pause className="h-3 w-3 mr-1" />
                  Pause
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => updateStatusMutation.mutate({ id: enrollment.id, status: 'active' })}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Reprendre
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={() => updateStatusMutation.mutate({ id: enrollment.id, status: 'cancelled' })}
              >
                <X className="h-3 w-3 mr-1" />
                Annuler
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
