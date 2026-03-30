import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useTranslation } from 'react-i18next';
import { ListTodo, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useUpdateReactivationTask, type TaskOutcome } from '@/shared/hooks/useReactivationTasks';

interface ActiveTasksWidgetProps {
  patientId: string;
}

const TASK_TYPE_KEYS: Record<string, string> = {
  overdue_recall: 'overdueRecall',
  dormant: 'dormant',
  no_show_followup: 'noShowFollowup',
  manual: 'manual',
  cancelled_followup: 'cancelledFollowup',
};

const PRIORITY_KEYS: Record<string, string> = {
  urgent: 'urgent',
  high: 'high',
  normal: 'normal',
  low: 'low',
};

export function ActiveTasksWidget({ patientId }: ActiveTasksWidgetProps) {
  const { t, i18n } = useTranslation(['patientDetail']);
  const dateLocale = i18n.language === 'fr' ? frLocale : enUS;
  const updateTask = useUpdateReactivationTask();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['patient-tasks', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reactivation_tasks')
        .select('*')
        .eq('patient_id', patientId)
        .in('status', ['pending', 'in_progress', 'snoozed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handleComplete = async (taskId: string, outcome: TaskOutcome) => {
    await updateTask.mutateAsync({
      taskId,
      updates: {
        status: 'completed',
        outcome,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-muted rounded w-24" />
        <div className="h-16 bg-muted rounded" />
      </div>
    );
  }

  const activeTasks = tasks?.filter(t =>
    t.status !== 'snoozed' ||
    (t.snoozed_until && isPast(parseISO(t.snoozed_until)))
  ) || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <ListTodo className="h-4 w-4" />
          {t('patientDetail:tasks.activeTasks')}
        </h3>
        {activeTasks.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            {activeTasks.length}
          </span>
        )}
      </div>

      {activeTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('patientDetail:tasks.noActiveTasks')}</p>
      ) : (
        <div className="space-y-2">
          {activeTasks.map((task) => (
            <div
              key={task.id}
              className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    {TASK_TYPE_KEYS[task.task_type]
                      ? t(`patientDetail:tasks.${TASK_TYPE_KEYS[task.task_type]}`)
                      : task.task_type}
                  </div>
                  {task.due_date && (
                    <div className={`text-xs flex items-center gap-1 mt-1 ${
                      isPast(parseISO(task.due_date)) ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      {isPast(parseISO(task.due_date)) ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {format(parseISO(task.due_date), 'd MMM', { locale: dateLocale })}
                    </div>
                  )}
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  task.priority === 'urgent' ? 'bg-destructive/10 text-destructive' :
                  task.priority === 'high' ? 'bg-warning/10 text-warning' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {PRIORITY_KEYS[task.priority]
                    ? t(`patientDetail:tasks.${PRIORITY_KEYS[task.priority]}`)
                    : task.priority}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7 text-xs"
                  onClick={() => handleComplete(task.id, 'appointment_booked')}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t('patientDetail:tasks.appointmentBooked')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => handleComplete(task.id, 'no_response')}
                >
                  {t('patientDetail:tasks.noResponse')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
