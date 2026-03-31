import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  useCreateReactivationTask,
  type TaskPriority,
  type TaskType,
} from '@/shared/hooks/useReactivationTasks';
import { toast } from 'sonner';

interface StaffMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

type AssignmentTaskType = 'manual' | 'overdue_recall' | 'dormant' | 'no_show_followup' | 'cancelled_followup';

interface TaskAssignmentDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultPatientId?: string;
  defaultPatientName?: string;
  trigger?: React.ReactNode;
}

export function TaskAssignmentDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultPatientId,
  defaultPatientName,
  trigger,
}: TaskAssignmentDialogProps) {
  const { t } = useTranslation(['crm', 'common']);
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => controlledOnOpenChange?.(v)
    : setInternalOpen;

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    defaultPatientId && defaultPatientName
      ? {
          id: defaultPatientId,
          first_name: defaultPatientName.split(' ')[0] || '',
          last_name: defaultPatientName.split(' ').slice(1).join(' ') || '',
          email: null,
        }
      : null,
  );
  const [taskType, setTaskType] = useState<AssignmentTaskType>('manual');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (defaultPatientId && defaultPatientName && !selectedPatient) {
      setSelectedPatient({
        id: defaultPatientId,
        first_name: defaultPatientName.split(' ')[0] || '',
        last_name: defaultPatientName.split(' ').slice(1).join(' ') || '',
        email: null,
      });
    }
  }, [defaultPatientId, defaultPatientName, selectedPatient]);

  const createTask = useCreateReactivationTask();

  const { data: staffMembers = [] } = useQuery({
    queryKey: ['staff-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('role', ['admin', 'clinic_staff'])
        .order('first_name');

      if (error) throw error;
      return data as StaffMember[];
    },
  });

  const { data: patients = [], isLoading: isLoadingPatients } = useQuery({
    queryKey: ['patient-search-assignment', patientSearch],
    queryFn: async () => {
      if (patientSearch.length < 2) return [];

      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email')
        .or(
          `first_name.ilike.%${patientSearch}%,last_name.ilike.%${patientSearch}%,email.ilike.%${patientSearch}%`,
        )
        .limit(10);

      if (error) throw error;
      return data as Patient[];
    },
    enabled: patientSearch.length >= 2,
  });

  const resetForm = () => {
    if (!defaultPatientId) {
      setSelectedPatient(null);
    }
    setTaskType('manual');
    setPriority('normal');
    setAssignedTo('');
    setDueDate('');
    setNotes('');
    setPatientSearch('');
  };

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast.error(
        t('crm:taskAssignment.selectPatientError', {
          defaultValue: 'Veuillez selectionner un patient',
        }),
      );
      return;
    }

    try {
      await createTask.mutateAsync({
        patient_id: selectedPatient.id,
        task_type: taskType as TaskType,
        priority,
        assigned_to: assignedTo || undefined,
        due_date: dueDate || undefined,
        notes: notes || undefined,
        created_by: user?.id,
      });

      toast.success(
        t('crm:taskAssignment.created', {
          defaultValue: 'Tache assignee avec succes',
        }),
      );
      setOpen(false);
      resetForm();
    } catch {
      // Error is handled in the hook
    }
  };

  const getStaffName = (staff: StaffMember) => {
    if (staff.first_name || staff.last_name) {
      return `${staff.first_name || ''} ${staff.last_name || ''}`.trim();
    }
    return staff.email;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetForm();
      }}
    >
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              {t('crm:taskAssignment.newTask', {
                defaultValue: 'Assigner une tache',
              })}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {t('crm:taskAssignment.title', {
              defaultValue: 'Assigner une tache',
            })}
          </DialogTitle>
          <DialogDescription>
            {t('crm:taskAssignment.description', {
              defaultValue:
                'Creer et assigner une tache de suivi a un membre de l\'equipe',
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient Selection */}
          <div className="space-y-2">
            <Label>
              {t('crm:taskAssignment.patient', { defaultValue: 'Patient' })}
            </Label>
            <Popover
              open={patientSearchOpen}
              onOpenChange={setPatientSearchOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={patientSearchOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedPatient ? (
                    <span>
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {t('crm:taskAssignment.searchPatient', {
                        defaultValue: 'Rechercher un patient...',
                      })}
                    </span>
                  )}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder={t('crm:taskAssignment.searchPlaceholder', {
                      defaultValue: 'Nom, prenom ou email...',
                    })}
                    value={patientSearch}
                    onValueChange={setPatientSearch}
                  />
                  <CommandList>
                    {patientSearch.length < 2 ? (
                      <CommandEmpty>
                        {t('crm:taskAssignment.minChars', {
                          defaultValue: 'Tapez au moins 2 caracteres',
                        })}
                      </CommandEmpty>
                    ) : isLoadingPatients ? (
                      <CommandEmpty>
                        {t('crm:taskAssignment.searching', {
                          defaultValue: 'Recherche...',
                        })}
                      </CommandEmpty>
                    ) : patients.length === 0 ? (
                      <CommandEmpty>
                        {t('crm:taskAssignment.noPatientFound', {
                          defaultValue: 'Aucun patient trouve',
                        })}
                      </CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {patients.map((patient) => (
                          <CommandItem
                            key={patient.id}
                            value={patient.id}
                            onSelect={() => {
                              setSelectedPatient(patient);
                              setPatientSearchOpen(false);
                            }}
                          >
                            <User className="mr-2 h-4 w-4" />
                            <div>
                              <p>
                                {patient.first_name} {patient.last_name}
                              </p>
                              {patient.email && (
                                <p className="text-xs text-muted-foreground">
                                  {patient.email}
                                </p>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Task Type */}
          <div className="space-y-2">
            <Label>
              {t('crm:taskAssignment.taskType', {
                defaultValue: 'Type de tache',
              })}
            </Label>
            <Select
              value={taskType}
              onValueChange={(v) => setTaskType(v as AssignmentTaskType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">
                  {t('crm:taskAssignment.typeManual', {
                    defaultValue: 'Suivi general',
                  })}
                </SelectItem>
                <SelectItem value="overdue_recall">
                  {t('crm:taskAssignment.typeFollowUp', {
                    defaultValue: 'Relance',
                  })}
                </SelectItem>
                <SelectItem value="dormant">
                  {t('crm:taskAssignment.typeReactivation', {
                    defaultValue: 'Reactivation',
                  })}
                </SelectItem>
                <SelectItem value="no_show_followup">
                  {t('crm:taskAssignment.typeOutreach', {
                    defaultValue: 'Suivi no-show',
                  })}
                </SelectItem>
                <SelectItem value="cancelled_followup">
                  {t('crm:taskAssignment.typeCancelled', {
                    defaultValue: 'Suivi annulation',
                  })}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label>
              {t('crm:taskAssignment.assignTo', {
                defaultValue: 'Assigner a',
              })}
            </Label>
            <Select
              value={assignedTo || 'unassigned'}
              onValueChange={(v) =>
                setAssignedTo(v === 'unassigned' ? '' : v)
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t('crm:taskAssignment.unassigned', {
                    defaultValue: 'Non assigne',
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">
                  {t('crm:taskAssignment.unassigned', {
                    defaultValue: 'Non assigne',
                  })}
                </SelectItem>
                {staffMembers.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {getStaffName(staff)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>
              {t('crm:taskAssignment.priority', {
                defaultValue: 'Priorite',
              })}
            </Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as TaskPriority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  {t('crm:taskAssignment.priorityLow', {
                    defaultValue: 'Basse',
                  })}
                </SelectItem>
                <SelectItem value="normal">
                  {t('crm:taskAssignment.priorityNormal', {
                    defaultValue: 'Normale',
                  })}
                </SelectItem>
                <SelectItem value="high">
                  {t('crm:taskAssignment.priorityHigh', {
                    defaultValue: 'Haute',
                  })}
                </SelectItem>
                <SelectItem value="urgent">
                  {t('crm:taskAssignment.priorityUrgent', {
                    defaultValue: 'Urgente',
                  })}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>
              {t('crm:taskAssignment.dueDate', {
                defaultValue: 'Date d\'echeance',
              })}
            </Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>
              {t('crm:taskAssignment.notes', { defaultValue: 'Notes' })}
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('crm:taskAssignment.notesPlaceholder', {
                defaultValue: 'Instructions ou details supplementaires...',
              })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
          >
            {t('common:cancel', { defaultValue: 'Annuler' })}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createTask.isPending || !selectedPatient}
          >
            {createTask.isPending
              ? t('crm:taskAssignment.assigning', {
                  defaultValue: 'Assignation...',
                })
              : t('crm:taskAssignment.assign', {
                  defaultValue: 'Assigner',
                })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
