import { useState, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { addDays } from 'date-fns';
import {
  Clock,
  Phone,
  Mail,
  CheckCircle,
  User,
  AlertTriangle,
  Moon,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type ReactivationTask,
  type TaskOutcome,
  useCompleteTask,
  useSnoozeTask,
  useLogAttempt
} from '@/shared/hooks/useReactivationTasks';
import { useNavigate } from 'react-router-dom';
import { SendMessageDialog } from '@/modules/crm/components/communications/SendMessageDialog';

interface ReactivationTaskCardProps {
  task: ReactivationTask;
}

export const ReactivationTaskCard = forwardRef<HTMLDivElement, ReactivationTaskCardProps>(
  function ReactivationTaskCard({ task }, ref) {
  const { t } = useTranslation(['tasks', 'common']);
  const navigate = useNavigate();
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showAttemptDialog, setShowAttemptDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [outcome, setOutcome] = useState<TaskOutcome>('appointment_booked');
  const [notes, setNotes] = useState('');
  const [shouldSnooze, setShouldSnooze] = useState(false);
  const [snoozeDays, setSnoozeDays] = useState('7');

  const completeTask = useCompleteTask();
  const snoozeTask = useSnoozeTask();
  const logAttempt = useLogAttempt();

  const TASK_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    overdue_recall: {
      label: t('tasks:overdueRecall'),
      icon: <Clock className="h-4 w-4" />,
      color: 'text-destructive bg-destructive/10'
    },
    dormant: {
      label: t('tasks:dormantPatient'),
      icon: <Moon className="h-4 w-4" />,
      color: 'text-warning bg-warning/10'
    },
    no_show_followup: {
      label: t('tasks:noShowFollowup'),
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'text-warning bg-warning/10'
    },
    manual: {
      label: t('tasks:manualFollowup'),
      icon: <User className="h-4 w-4" />,
      color: 'text-primary bg-primary/10'
    },
    cancelled_followup: {
      label: t('tasks:cancelledFollowup'),
      icon: <XCircle className="h-4 w-4" />,
      color: 'text-muted-foreground bg-muted'
    },
  };

  const OUTCOME_LABELS: Record<TaskOutcome, string> = {
    appointment_booked: t('tasks:outcomeBooked'),
    patient_declined: t('tasks:outcomeDeclined'),
    no_response: t('tasks:outcomeNoResponse'),
    wrong_contact: t('tasks:outcomeWrongContact'),
    other: t('tasks:outcomeOther'),
  };

  const taskType = TASK_TYPE_LABELS[task.task_type] || TASK_TYPE_LABELS.overdue_recall;
  const patient = task.patients;

  const handleComplete = async () => {
    await completeTask.mutateAsync({
      taskId: task.id,
      outcome,
      notes: notes || undefined,
    });
    setShowCompleteDialog(false);
    setNotes('');
  };

  const handleLogAttempt = async () => {
    await logAttempt.mutateAsync({
      taskId: task.id,
      notes: notes || undefined,
    });

    // If snooze checkbox is checked, also snooze the task
    if (shouldSnooze) {
      const snoozedUntil = addDays(new Date(), parseInt(snoozeDays)).toISOString().split('T')[0];
      await snoozeTask.mutateAsync({
        taskId: task.id,
        snoozedUntil,
        notes: notes || undefined,
      });
    }

    setShowAttemptDialog(false);
    setNotes('');
    setShouldSnooze(false);
  };

  return (
    <>
      <div ref={ref} className="flex flex-col gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
        {/* Header: Task Type + Patient Info */}
        <div className="flex items-start gap-3">
          {/* Task Type Badge */}
          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${taskType.color}`}>
            {taskType.icon}
          </div>

          {/* Patient Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">
              {patient ? `${patient.first_name} ${patient.last_name}` : t('tasks:unknownPatient')}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <span className={`px-1.5 py-0.5 rounded text-xs ${taskType.color}`}>
                {taskType.label}
              </span>
              {task.attempt_count > 0 && (
                <span className="text-xs">• {t('tasks:attemptCount', { count: task.attempt_count })}</span>
              )}
              {task.assigned_to_profile && (
                <span className="text-xs">
                  • {t('tasks:assigned')}: {task.assigned_to_profile.first_name || ''} {task.assigned_to_profile.last_name || ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="bg-success hover:bg-success/90 text-success-foreground"
            onClick={() => setShowCompleteDialog(true)}
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            {t('tasks:completed')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAttemptDialog(true)}
          >
            <Phone className="h-4 w-4 mr-1.5" />
            {t('tasks:attempt')}
          </Button>

          <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

          {patient?.email && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmailDialog(true)}
              title={patient.email}
            >
              <Mail className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Email</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/crm/patients/${task.patient_id}`)}
            className="ml-auto"
          >
            <User className="h-4 w-4 mr-1.5" />
            {t('tasks:profile')}
          </Button>
        </div>
      </div>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('tasks:completeTask')}</DialogTitle>
            <DialogDescription>
              {t('tasks:completeTaskDescription', { name: patient ? `${patient.first_name} ${patient.last_name}` : '' })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('tasks:outcome')}</Label>
              <Select value={outcome} onValueChange={(v) => setOutcome(v as TaskOutcome)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(OUTCOME_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('tasks:notesOptional')}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('tasks:addNotes')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              {t('common:cancel')}
            </Button>
            <Button onClick={handleComplete} disabled={completeTask.isPending}>
              {completeTask.isPending ? t('tasks:processing') : t('tasks:complete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Attempt Dialog with optional snooze */}
      <Dialog open={showAttemptDialog} onOpenChange={(open) => {
        setShowAttemptDialog(open);
        if (!open) {
          setShouldSnooze(false);
          setNotes('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('tasks:logAttempt')}</DialogTitle>
            <DialogDescription>
              {t('tasks:logAttemptDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('tasks:notes')}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('tasks:attemptPlaceholder')}
              />
            </div>

            {/* Optional snooze checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="shouldSnooze"
                checked={shouldSnooze}
                onChange={(e) => setShouldSnooze(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <Label htmlFor="shouldSnooze" className="text-sm font-normal cursor-pointer">
                {t('tasks:scheduleReminder')}
              </Label>
            </div>

            {/* Conditional snooze duration */}
            {shouldSnooze && (
              <div className="space-y-2 pl-6">
                <Label>{t('tasks:remindIn')}</Label>
                <Select value={snoozeDays} onValueChange={setSnoozeDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t('tasks:1day')}</SelectItem>
                    <SelectItem value="3">{t('tasks:3days')}</SelectItem>
                    <SelectItem value="7">{t('tasks:1week')}</SelectItem>
                    <SelectItem value="14">{t('tasks:2weeks')}</SelectItem>
                    <SelectItem value="30">{t('tasks:1month')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAttemptDialog(false)}>
              {t('common:cancel')}
            </Button>
            <Button onClick={handleLogAttempt} disabled={logAttempt.isPending || snoozeTask.isPending}>
              {(logAttempt.isPending || snoozeTask.isPending) ? t('tasks:processing') : t('tasks:save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog via Resend */}
      {patient && (
        <SendMessageDialog
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          preselectedPatient={{
            id: task.patient_id,
            first_name: patient.first_name,
            last_name: patient.last_name,
            email: patient.email,
            phone: patient.phone || null,
          }}
          taskId={task.id}
        />
      )}
    </>
  );
});
