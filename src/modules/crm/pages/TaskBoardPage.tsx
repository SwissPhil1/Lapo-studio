import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isToday, isPast, isThisWeek, type Locale } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
  ListTodo,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useReactivationTasks, type ReactivationTask, type TaskType, type TaskStatus } from '@/shared/hooks/useReactivationTasks';
import { useBulkUpdateTasks } from '@/shared/hooks/useBulkTaskActions';
import { CreateTaskDialog } from '@/modules/crm/components/tasks/CreateTaskDialog';

type DueDateFilter = 'all' | 'overdue' | 'today' | 'this_week';

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  overdue_recall: 'Overdue Recall',
  dormant: 'Dormant Patient',
  no_show_followup: 'No-Show Follow-up',
  manual: 'Manual Task',
  cancelled_followup: 'Cancelled Follow-up',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500/15 text-red-700 dark:text-red-400',
  high: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  normal: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  low: 'bg-gray-500/15 text-gray-700 dark:text-gray-400',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  in_progress: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  completed: 'bg-green-500/15 text-green-700 dark:text-green-400',
  snoozed: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  cancelled: 'bg-gray-500/15 text-gray-700 dark:text-gray-400',
};

export default function TaskBoardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language === 'fr' ? frLocale : enUS;

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'complete' | 'dismiss' | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const statusFilters: TaskStatus[] | undefined = statusFilter === 'active'
    ? ['pending', 'in_progress']
    : statusFilter === 'all'
    ? undefined
    : [statusFilter as TaskStatus];

  const { data: tasks = [], isLoading, isError } = useReactivationTasks({
    status: statusFilters,
    taskType: typeFilter !== 'all' ? [typeFilter as TaskType] : undefined,
  });

  const bulkUpdate = useBulkUpdateTasks();

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority === priorityFilter);
    }

    if (dueDateFilter !== 'all') {
      result = result.filter(task => {
        if (!task.due_date) return false;
        const d = parseISO(task.due_date);
        switch (dueDateFilter) {
          case 'overdue': return isPast(d) && !isToday(d);
          case 'today': return isToday(d);
          case 'this_week': return isThisWeek(d);
          default: return true;
        }
      });
    }

    return result;
  }, [tasks, priorityFilter, dueDateFilter]);

  const overdueTasks = tasks.filter(t => t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)));
  const todayTasks = tasks.filter(t => t.due_date && isToday(parseISO(t.due_date)));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredTasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedIds.size === 0) return;
    bulkUpdate.mutate(
      {
        ids: Array.from(selectedIds),
        status: bulkAction === 'complete' ? 'completed' : 'cancelled',
        outcome: bulkAction === 'complete' ? 'appointment_booked' : undefined,
      },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          setBulkAction(null);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListTodo className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{t('taskBoard.title', { defaultValue: 'Task Board' })}</h1>
          <Badge variant="secondary">{filteredTasks.length}</Badge>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          {t('taskBoard.createTask', { defaultValue: 'Create Task' })}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setDueDateFilter('overdue')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">{t('taskBoard.overdue', { defaultValue: 'Overdue' })}</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{overdueTasks.length}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setDueDateFilter('today')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">{t('taskBoard.dueToday', { defaultValue: 'Due Today' })}</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{todayTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{t('taskBoard.pending', { defaultValue: 'Pending' })}</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{tasks.filter(t => t.status === 'pending').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">{t('taskBoard.total', { defaultValue: 'Total' })}</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{tasks.length}</p>
          </CardContent>
        </Card>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
          {t('common.loadError', { defaultValue: 'Failed to load data. Please try again.' })}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('taskBoard.filterType', { defaultValue: 'Task Type' })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('taskBoard.allTypes', { defaultValue: 'All Types' })}</SelectItem>
              <SelectItem value="overdue_recall">{t('taskBoard.overdueRecall', { defaultValue: 'Overdue Recall' })}</SelectItem>
              <SelectItem value="dormant">{t('taskBoard.dormant', { defaultValue: 'Dormant' })}</SelectItem>
              <SelectItem value="no_show_followup">{t('taskBoard.noShowFollowup', { defaultValue: 'No-Show' })}</SelectItem>
              <SelectItem value="manual">{t('taskBoard.manual', { defaultValue: 'Manual' })}</SelectItem>
              <SelectItem value="cancelled_followup">{t('taskBoard.cancelledFollowup', { defaultValue: 'Cancelled' })}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('taskBoard.filterPriority', { defaultValue: 'Priority' })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('taskBoard.allPriorities', { defaultValue: 'All Priorities' })}</SelectItem>
              <SelectItem value="urgent">{t('taskBoard.urgent', { defaultValue: 'Urgent' })}</SelectItem>
              <SelectItem value="high">{t('taskBoard.high', { defaultValue: 'High' })}</SelectItem>
              <SelectItem value="normal">{t('taskBoard.normalPriority', { defaultValue: 'Normal' })}</SelectItem>
              <SelectItem value="low">{t('taskBoard.low', { defaultValue: 'Low' })}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('taskBoard.filterStatus', { defaultValue: 'Status' })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t('taskBoard.active', { defaultValue: 'Active' })}</SelectItem>
              <SelectItem value="pending">{t('taskBoard.pendingOnly', { defaultValue: 'Pending' })}</SelectItem>
              <SelectItem value="in_progress">{t('taskBoard.inProgress', { defaultValue: 'In Progress' })}</SelectItem>
              <SelectItem value="completed">{t('taskBoard.completed', { defaultValue: 'Completed' })}</SelectItem>
              <SelectItem value="all">{t('taskBoard.allStatuses', { defaultValue: 'All' })}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dueDateFilter} onValueChange={(v) => setDueDateFilter(v as DueDateFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('taskBoard.filterDueDate', { defaultValue: 'Due Date' })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('taskBoard.allDates', { defaultValue: 'All Dates' })}</SelectItem>
              <SelectItem value="overdue">{t('taskBoard.overdueOnly', { defaultValue: 'Overdue' })}</SelectItem>
              <SelectItem value="today">{t('taskBoard.todayOnly', { defaultValue: 'Today' })}</SelectItem>
              <SelectItem value="this_week">{t('taskBoard.thisWeek', { defaultValue: 'This Week' })}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <span className="text-sm font-medium">
            {t('taskBoard.selected', { defaultValue: '{{count}} selected', count: selectedIds.size })}
          </span>
          <Button size="sm" variant="outline" onClick={() => setBulkAction('complete')}>
            <CheckCircle className="mr-1 h-4 w-4" />
            {t('taskBoard.bulkComplete', { defaultValue: 'Complete' })}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBulkAction('dismiss')}>
            <XCircle className="mr-1 h-4 w-4" />
            {t('taskBoard.bulkDismiss', { defaultValue: 'Dismiss' })}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            {t('taskBoard.clearSelection', { defaultValue: 'Clear' })}
          </Button>
        </div>
      )}

      {/* Task Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={filteredTasks.length > 0 && selectedIds.size === filteredTasks.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>{t('taskBoard.patient', { defaultValue: 'Patient' })}</TableHead>
              <TableHead>{t('taskBoard.type', { defaultValue: 'Type' })}</TableHead>
              <TableHead>{t('taskBoard.priority', { defaultValue: 'Priority' })}</TableHead>
              <TableHead>{t('taskBoard.status', { defaultValue: 'Status' })}</TableHead>
              <TableHead>{t('taskBoard.dueDate', { defaultValue: 'Due Date' })}</TableHead>
              <TableHead>{t('taskBoard.assignedTo', { defaultValue: 'Assigned To' })}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  {t('taskBoard.noTasks', { defaultValue: 'No tasks match the current filters.' })}
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  selected={selectedIds.has(task.id)}
                  onSelect={() => toggleSelect(task.id)}
                  onNavigate={() => navigate(`/crm/patients/${task.patient_id}`)}
                  locale={locale}
                  t={t}
                />
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Bulk Action Confirmation */}
      <AlertDialog open={!!bulkAction} onOpenChange={() => setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === 'complete'
                ? t('taskBoard.confirmComplete', { defaultValue: 'Complete Tasks?' })
                : t('taskBoard.confirmDismiss', { defaultValue: 'Dismiss Tasks?' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('taskBoard.bulkActionDesc', {
                defaultValue: 'This will update {{count}} task(s).',
                count: selectedIds.size,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', { defaultValue: 'Cancel' })}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkAction}>
              {t('common.confirm', { defaultValue: 'Confirm' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showCreateDialog && (
        <CreateTaskDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      )}
    </div>
  );
}

function TaskRow({
  task,
  selected,
  onSelect,
  onNavigate,
  locale,
  t,
}: {
  task: ReactivationTask;
  selected: boolean;
  onSelect: () => void;
  onNavigate: () => void;
  locale: Locale;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date));
  const patientName = task.patients
    ? `${task.patients.first_name} ${task.patients.last_name}`
    : t('taskBoard.unknownPatient', { defaultValue: 'Unknown' });

  const assignedName = task.assigned_to_profile
    ? `${task.assigned_to_profile.first_name ?? ''} ${task.assigned_to_profile.last_name ?? ''}`.trim()
    : '—';

  return (
    <TableRow className={selected ? 'bg-primary/5' : undefined}>
      <TableCell>
        <Checkbox checked={selected} onCheckedChange={onSelect} />
      </TableCell>
      <TableCell>
        <button
          className="text-left font-medium text-primary hover:underline"
          onClick={onNavigate}
        >
          {patientName}
        </button>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {TASK_TYPE_LABELS[task.task_type] || task.task_type}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={PRIORITY_COLORS[task.priority] || ''}>
          {task.priority}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={STATUS_COLORS[task.status] || ''}>
          {task.status.replace('_', ' ')}
        </Badge>
      </TableCell>
      <TableCell>
        {task.due_date ? (
          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
            {format(parseISO(task.due_date), 'dd MMM yyyy', { locale })}
          </span>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{assignedName}</TableCell>
      <TableCell>
        <Button size="sm" variant="ghost" onClick={onNavigate}>
          →
        </Button>
      </TableCell>
    </TableRow>
  );
}
