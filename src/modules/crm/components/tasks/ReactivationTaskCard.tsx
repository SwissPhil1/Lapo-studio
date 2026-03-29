import { useState, forwardRef } from 'react';
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

const TASK_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  overdue_recall: { 
    label: 'Rappel en retard', 
    icon: <Clock className="h-4 w-4" />,
    color: 'text-destructive bg-destructive/10'
  },
  dormant: { 
    label: 'Patient inactif', 
    icon: <Moon className="h-4 w-4" />,
    color: 'text-warning bg-warning/10'
  },
  no_show_followup: { 
    label: 'Suivi no-show', 
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-orange-500 bg-orange-500/10'
  },
  manual: { 
    label: 'Suivi manuel', 
    icon: <User className="h-4 w-4" />,
    color: 'text-primary bg-primary/10'
  },
  cancelled_followup: { 
    label: 'Suivi annulation', 
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-slate-500 bg-slate-500/10'
  },
};

const OUTCOME_LABELS: Record<TaskOutcome, string> = {
  appointment_booked: 'RDV pris',
  patient_declined: 'Patient a refusé',
  no_response: 'Pas de réponse',
  wrong_contact: 'Mauvais contact',
  other: 'Autre',
};

export const ReactivationTaskCard = forwardRef<HTMLDivElement, ReactivationTaskCardProps>(
  function ReactivationTaskCard({ task }, ref) {
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

          {/* Patient Info - No click behavior */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">
              {patient ? `${patient.first_name} ${patient.last_name}` : 'Patient inconnu'}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <span className={`px-1.5 py-0.5 rounded text-xs ${taskType.color}`}>
                {taskType.label}
              </span>
              {task.attempt_count > 0 && (
                <span className="text-xs">• {task.attempt_count} tentative{task.attempt_count > 1 ? 's' : ''}</span>
              )}
              {task.assigned_to_profile && (
                <span className="text-xs">
                  • Assigné: {task.assigned_to_profile.first_name || ''} {task.assigned_to_profile.last_name || ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons - Visible and clearly labeled */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary action: Complete */}
          <Button
            variant="default"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setShowCompleteDialog(true)}
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            Terminé
          </Button>

          {/* Log attempt */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAttemptDialog(true)}
          >
            <Phone className="h-4 w-4 mr-1.5" />
            Tentative
          </Button>

          {/* Separator for secondary actions */}
          <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

          {/* Email button - opens SendMessageDialog via Resend */}
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

          {/* View patient profile - explicit action */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/crm/patients/${task.patient_id}`)}
            className="ml-auto"
          >
            <User className="h-4 w-4 mr-1.5" />
            Profil
          </Button>
        </div>
      </div>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminer la tâche</DialogTitle>
            <DialogDescription>
              Indiquez le résultat de cette relance pour {patient?.first_name} {patient?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Résultat</Label>
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
              <Label>Notes (optionnel)</Label>
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajouter des notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleComplete} disabled={completeTask.isPending}>
              {completeTask.isPending ? 'En cours...' : 'Terminer'}
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
            <DialogTitle>Enregistrer une tentative</DialogTitle>
            <DialogDescription>
              Notez les détails de votre tentative de contact
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Appelé, pas de réponse, message vocal laissé..."
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
                Programmer un rappel
              </Label>
            </div>
            
            {/* Conditional snooze duration */}
            {shouldSnooze && (
              <div className="space-y-2 pl-6">
                <Label>Rappeler dans</Label>
                <Select value={snoozeDays} onValueChange={setSnoozeDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 jour</SelectItem>
                    <SelectItem value="3">3 jours</SelectItem>
                    <SelectItem value="7">1 semaine</SelectItem>
                    <SelectItem value="14">2 semaines</SelectItem>
                    <SelectItem value="30">1 mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAttemptDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleLogAttempt} disabled={logAttempt.isPending || snoozeTask.isPending}>
              {(logAttempt.isPending || snoozeTask.isPending) ? 'En cours...' : 'Enregistrer'}
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
