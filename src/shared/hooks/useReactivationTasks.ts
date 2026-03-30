import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { getLocale } from '@/shared/lib/format';

export type TaskType = 'overdue_recall' | 'dormant' | 'no_show_followup' | 'manual' | 'cancelled_followup';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'snoozed' | 'cancelled';
export type TaskOutcome = 'appointment_booked' | 'patient_declined' | 'no_response' | 'wrong_contact' | 'other';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ReactivationTask {
  id: string;
  patient_id: string;
  task_type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  snoozed_until: string | null;
  completed_at: string | null;
  completed_by: string | null;
  outcome: TaskOutcome | null;
  notes: string | null;
  attempt_count: number;
  last_attempt_at: string | null;
  next_attempt_at: string | null;
  metadata: Record<string, unknown>;
  patients?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  };
  created_by_profile?: {
    first_name: string | null;
    last_name: string | null;
  };
  assigned_to_profile?: {
    first_name: string | null;
    last_name: string | null;
  };
}

export function useReactivationTasks(filters?: {
  status?: TaskStatus[];
  taskType?: TaskType[];
}) {
  return useQuery({
    queryKey: ['reactivation-tasks', filters],
    queryFn: async () => {
      let query = supabase
        .from('reactivation_tasks')
        .select(`
          *,
          patients (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.taskType && filters.taskType.length > 0) {
        query = query.in('task_type', filters.taskType);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Fetch profile data for created_by and assigned_to
      const tasks = data as ReactivationTask[];
      const userIds = new Set<string>();
      tasks.forEach(task => {
        if (task.created_by) userIds.add(task.created_by);
        if (task.assigned_to) userIds.add(task.assigned_to);
      });
      
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', Array.from(userIds));
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        tasks.forEach(task => {
          if (task.created_by && profileMap.has(task.created_by)) {
            task.created_by_profile = profileMap.get(task.created_by);
          }
          if (task.assigned_to && profileMap.has(task.assigned_to)) {
            task.assigned_to_profile = profileMap.get(task.assigned_to);
          }
        });
      }
      
      return tasks;
    },
  });
}

export function useReactivationTaskCounts() {
  return useQuery({
    queryKey: ['reactivation-task-counts'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get counts by type for pending/in_progress tasks (excluding snoozed that are still in the future)
      const { data, error } = await supabase
        .from('reactivation_tasks')
        .select('task_type, status, snoozed_until')
        .in('status', ['pending', 'in_progress', 'snoozed']);

      if (error) throw error;

      const counts = {
        overdue_recall: 0,
        dormant: 0,
        no_show_followup: 0,
        manual: 0,
        cancelled_followup: 0,
        total: 0,
      };

      (data || []).forEach((task) => {
        // Skip snoozed tasks that are still in snooze period
        if (task.status === 'snoozed' && task.snoozed_until && task.snoozed_until > today) {
          return;
        }
        
        const taskType = task.task_type as TaskType;
        if (taskType in counts) {
          counts[taskType]++;
        }
        counts.total++;
      });

      return counts;
    },
  });
}

export function useCreateReactivationTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: {
      patient_id: string;
      task_type: TaskType;
      priority?: TaskPriority;
      assigned_to?: string;
      due_date?: string;
      notes?: string;
      created_by?: string;
    }) => {
      const { data, error } = await supabase
        .from('reactivation_tasks')
        .insert({
          patient_id: task.patient_id,
          task_type: task.task_type,
          priority: task.priority || 'normal',
          assigned_to: task.assigned_to || null,
          due_date: task.due_date || null,
          notes: task.notes || null,
          created_by: task.created_by || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation (task already exists)
        if (error.code === '23505') {
          throw new Error(i18n.t('common:taskAlreadyExists'));
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactivation-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['reactivation-task-counts'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateReactivationTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: Partial<{
        status: TaskStatus;
        priority: TaskPriority;
        outcome: TaskOutcome;
        notes: string;
        snoozed_until: string;
        attempt_count: number;
        last_attempt_at: string;
        next_attempt_at: string;
      }>;
    }) => {
      const updateData: Record<string, unknown> = { ...updates };

      // If completing the task, set completed_at and completed_by
      if (updates.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          updateData.completed_by = user.id;
        }
      }

      // If snoozing, ensure status is set to snoozed
      if (updates.snoozed_until && !updates.status) {
        updateData.status = 'snoozed';
      }

      const { data, error } = await supabase
        .from('reactivation_tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactivation-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['reactivation-task-counts'] });
      toast.success(i18n.t('common:taskUpdated'));
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useLogAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      notes,
      nextAttemptAt,
      method,
      snoozeDays,
    }: {
      taskId: string;
      notes?: string;
      nextAttemptAt?: string;
      method?: 'email' | 'phone' | 'sms';
      snoozeDays?: number;
    }) => {
      // First get current attempt count
      const { data: task } = await supabase
        .from('reactivation_tasks')
        .select('attempt_count, notes')
        .eq('id', taskId)
        .single();

      const newAttemptCount = (task?.attempt_count || 0) + 1;
      const methodLabel = method === 'email' ? 'Email' : method === 'sms' ? 'SMS' : method === 'phone' ? i18n.t('common:call') : i18n.t('common:contact');
      const timestamp = new Date().toLocaleString(getLocale(), {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      const noteText = notes 
        ? `[${methodLabel} - ${timestamp}] ${notes}`
        : `[${methodLabel} - ${timestamp}] ${i18n.t('common:contactAttempt')}`;
      const newNotes = `${task?.notes || ''}\n${noteText}`.trim();

      // Calculate snooze date if snoozeDays provided
      let snoozedUntil: string | undefined;
      let status: 'in_progress' | 'snoozed' = 'in_progress';
      if (snoozeDays && snoozeDays > 0) {
        const snoozeDate = new Date();
        snoozeDate.setDate(snoozeDate.getDate() + snoozeDays);
        snoozedUntil = snoozeDate.toISOString().split('T')[0];
        status = 'snoozed';
      }

      const { data, error } = await supabase
        .from('reactivation_tasks')
        .update({
          attempt_count: newAttemptCount,
          last_attempt_at: new Date().toISOString(),
          next_attempt_at: nextAttemptAt,
          notes: newNotes,
          status,
          ...(snoozedUntil ? { snoozed_until: snoozedUntil } : {}),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reactivation-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['reactivation-task-counts'] });
      queryClient.invalidateQueries({ queryKey: ['patient-tasks'] });
      const message = variables.snoozeDays
        ? i18n.t('common:attemptRecordedReminder', { days: variables.snoozeDays })
        : i18n.t('common:attemptRecorded');
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useCompleteTask() {
  const updateTask = useUpdateReactivationTask();

  return useMutation({
    mutationFn: async ({
      taskId,
      outcome,
      notes,
    }: {
      taskId: string;
      outcome: TaskOutcome;
      notes?: string;
    }) => {
      return updateTask.mutateAsync({
        taskId,
        updates: {
          status: 'completed',
          outcome,
          notes,
        },
      });
    },
  });
}

export function useSnoozeTask() {
  const updateTask = useUpdateReactivationTask();

  return useMutation({
    mutationFn: async ({
      taskId,
      snoozedUntil,
      notes,
    }: {
      taskId: string;
      snoozedUntil: string;
      notes?: string;
    }) => {
      return updateTask.mutateAsync({
        taskId,
        updates: {
          status: 'snoozed',
          snoozed_until: snoozedUntil,
          notes,
        },
      });
    },
  });
}
