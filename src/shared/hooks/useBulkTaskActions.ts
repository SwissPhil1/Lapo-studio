import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { toast } from 'sonner';
import type { TaskStatus, TaskOutcome } from './useReactivationTasks';

export function useBulkUpdateTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ids,
      status,
      outcome,
    }: {
      ids: string[];
      status: TaskStatus;
      outcome?: TaskOutcome;
    }) => {
      const updates: Record<string, unknown> = { status };
      if (outcome) updates.outcome = outcome;
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) updates.completed_by = user.id;
      }

      const { error } = await supabase
        .from('reactivation_tasks')
        .update(updates)
        .in('id', ids);

      if (error) throw error;
      return { count: ids.length };
    },
    onSuccess: ({ count }) => {
      queryClient.invalidateQueries({ queryKey: ['reactivation-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['reactivation-task-counts'] });
      toast.success(`${count} task(s) updated`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
