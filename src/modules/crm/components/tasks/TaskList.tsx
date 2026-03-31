import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import {
  useReactivationTasks,
  useUpdateReactivationTask,
  type ReactivationTask,
  type TaskStatus,
} from '@/shared/hooks/useReactivationTasks';
import { formatDate } from '@/shared/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Moon,
  XCircle,
  ListTodo,
} from 'lucide-react';
import { TaskAssignmentDialog } from './TaskAssignmentDialog';

type FilterTab = 'all' | 'my_tasks' | 'overdue';

const TASK_TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  overdue_recall: {
    label: 'Rappel en retard',
    icon: <Clock className="h-3.5 w-3.5" />,
    color: 'bg-destructive/10 text-destructive',
  },
  dormant: {
    label: 'Patient inactif',
    icon: <Moon className="h-3.5 w-3.5" />,
    color: 'bg-warning/10 text-warning',
  },
  no_show_followup: {
    label: 'Suivi no-show',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    color: 'bg-warning/10 text-warning',
  },
  manual: {
    label: 'Suivi manuel',
    icon: <User className="h-3.5 w-3.5" />,
    color: 'bg-primary/10 text-primary',
  },
  cancelled_followup: {
    label: 'Suivi annulation',
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: 'bg-muted text-muted-foreground',
  },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: 'Basse', className: 'bg-muted text-muted-foreground' },
  normal: { label: 'Normale', className: 'bg-secondary text-secondary-foreground' },
  high: { label: 'Haute', className: 'bg-warning/10 text-warning' },
  urgent: { label: 'Urgente', className: 'bg-destructive/10 text-destructive' },
};

function getDueDateStatus(dueDate: string | null): 'overdue' | 'today' | 'upcoming' | 'none' {
  if (!dueDate) return 'none';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  if (due < today) return 'overdue';
  if (due.getTime() === today.getTime()) return 'today';
  return 'upcoming';
}

function getDueDateClassName(status: 'overdue' | 'today' | 'upcoming' | 'none'): string {
  switch (status) {
    case 'overdue':
      return 'text-destructive font-medium';
    case 'today':
      return 'text-warning font-medium';
    default:
      return 'text-muted-foreground';
  }
}

interface TaskRowProps {
  task: ReactivationTask;
  onComplete: (taskId: string) => void;
  isCompleting: boolean;
}

function TaskRow({ task, onComplete, isCompleting }: TaskRowProps) {
  const { t } = useTranslation(['crm']);
  const taskTypeConfig = TASK_TYPE_CONFIG[task.task_type] || TASK_TYPE_CONFIG.manual;
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.normal;
  const dueDateStatus = getDueDateStatus(task.due_date);
  const dueDateClassName = getDueDateClassName(dueDateStatus);
  const patient = task.patients;

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
      {/* Task type icon */}
      <div
        className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${taskTypeConfig.color}`}
      >
        {taskTypeConfig.icon}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground truncate">
            {patient
              ? `${patient.first_name} ${patient.last_name}`
              : t('crm:taskList.unknownPatient', { defaultValue: 'Patient inconnu' })}
          </span>
          <Badge variant="outline" className={`text-xs ${taskTypeConfig.color} border-0`}>
            {taskTypeConfig.label}
          </Badge>
          <Badge variant="outline" className={`text-xs ${priorityConfig.className} border-0`}>
            {priorityConfig.label}
          </Badge>
        </div>

        <div className="flex items-center gap-3 mt-1 text-sm">
          {task.assigned_to_profile && (
            <span className="text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              {task.assigned_to_profile.first_name || ''}{' '}
              {task.assigned_to_profile.last_name || ''}
            </span>
          )}
          {task.due_date && (
            <span className={`flex items-center gap-1 ${dueDateClassName}`}>
              <Clock className="h-3 w-3" />
              {dueDateStatus === 'overdue'
                ? t('crm:taskList.overdue', { defaultValue: 'En retard' })
                : dueDateStatus === 'today'
                  ? t('crm:taskList.dueToday', { defaultValue: "Aujourd'hui" })
                  : null}
              {' '}
              {formatDate(task.due_date)}
            </span>
          )}
          {task.notes && (
            <span className="text-muted-foreground truncate max-w-[200px]" title={task.notes}>
              {task.notes}
            </span>
          )}
        </div>
      </div>

      {/* Status / Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {task.status === 'completed' ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            {t('crm:taskList.completed', { defaultValue: 'Termine' })}
          </Badge>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => onComplete(task.id)}
            disabled={isCompleting}
          >
            <CheckCircle className="h-4 w-4" />
            {t('crm:taskList.markComplete', { defaultValue: 'Terminer' })}
          </Button>
        )}
      </div>
    </div>
  );
}

export function TaskList() {
  const { t } = useTranslation(['crm']);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const activeStatuses: TaskStatus[] = ['pending', 'in_progress', 'snoozed'];
  const { data: tasks = [], isLoading } = useReactivationTasks({
    status: activeStatuses,
  });
  const updateTask = useUpdateReactivationTask();

  const handleComplete = (taskId: string) => {
    updateTask.mutate({
      taskId,
      updates: { status: 'completed' },
    });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredTasks = useMemo(() => {
    // Sort by due_date ascending (nulls last)
    const sorted = [...tasks].sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    switch (activeTab) {
      case 'my_tasks':
        return sorted.filter((task) => task.assigned_to === user?.id);
      case 'overdue':
        return sorted.filter((task) => {
          if (!task.due_date) return false;
          const due = new Date(task.due_date);
          due.setHours(0, 0, 0, 0);
          return due < today;
        });
      default:
        return sorted;
    }
  }, [tasks, activeTab, user?.id, today]);

  const overdueCnt = useMemo(
    () =>
      tasks.filter((task) => {
        if (!task.due_date) return false;
        const due = new Date(task.due_date);
        due.setHours(0, 0, 0, 0);
        return due < today;
      }).length,
    [tasks, today],
  );

  const myTasksCnt = useMemo(
    () => tasks.filter((task) => task.assigned_to === user?.id).length,
    [tasks, user?.id],
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ListTodo className="h-5 w-5" />
          {t('crm:taskList.title', { defaultValue: 'Taches' })} ({tasks.length})
        </h3>
        <TaskAssignmentDialog />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
        <TabsList>
          <TabsTrigger value="all">
            {t('crm:taskList.tabAll', { defaultValue: 'Toutes' })} ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="my_tasks">
            {t('crm:taskList.tabMyTasks', { defaultValue: 'Mes taches' })} ({myTasksCnt})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            {t('crm:taskList.tabOverdue', { defaultValue: 'En retard' })} ({overdueCnt})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {filteredTasks.length > 0 ? (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  isCompleting={updateTask.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <ListTodo className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>
                {activeTab === 'my_tasks'
                  ? t('crm:taskList.noMyTasks', {
                      defaultValue: 'Aucune tache assignee',
                    })
                  : activeTab === 'overdue'
                    ? t('crm:taskList.noOverdue', {
                        defaultValue: 'Aucune tache en retard',
                      })
                    : t('crm:taskList.noTasks', {
                        defaultValue: 'Aucune tache en attente',
                      })}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
