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
import { useCreateReactivationTask, type TaskPriority } from '@/shared/hooks/useReactivationTasks';
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

interface CreateTaskDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultPatientId?: string;
  defaultPatientName?: string;
  trigger?: React.ReactNode;
}

export function CreateTaskDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultPatientId,
  defaultPatientName,
  trigger,
}: CreateTaskDialogProps = {}) {
  const { t } = useTranslation(['patientDetail']);
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (v: boolean) => controlledOnOpenChange?.(v) : setInternalOpen;

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    defaultPatientId && defaultPatientName
      ? { id: defaultPatientId, first_name: defaultPatientName.split(' ')[0] || '', last_name: defaultPatientName.split(' ').slice(1).join(' ') || '', email: null }
      : null
  );
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
        email: null
      });
    }
  }, [defaultPatientId, defaultPatientName]);

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
    queryKey: ['patient-search', patientSearch],
    queryFn: async () => {
      if (patientSearch.length < 2) return [];

      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email')
        .or(`first_name.ilike.%${patientSearch}%,last_name.ilike.%${patientSearch}%,email.ilike.%${patientSearch}%`)
        .limit(10);

      if (error) throw error;
      return data as Patient[];
    },
    enabled: patientSearch.length >= 2,
  });

  const resetForm = () => {
    setSelectedPatient(null);
    setPriority('normal');
    setAssignedTo('');
    setDueDate('');
    setNotes('');
    setPatientSearch('');
  };

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast.error(t('patientDetail:createTask.selectPatientError'));
      return;
    }

    try {
      await createTask.mutateAsync({
        patient_id: selectedPatient.id,
        task_type: 'manual',
        priority,
        assigned_to: assignedTo || undefined,
        due_date: dueDate || undefined,
        notes: notes || undefined,
        created_by: user?.id,
      });

      toast.success(t('patientDetail:createTask.created'));
      setOpen(false);
      resetForm();
    } catch (error) {
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
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              {t('patientDetail:createTask.newTask')}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('patientDetail:createTask.title')}</DialogTitle>
          <DialogDescription>
            {t('patientDetail:createTask.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient Selection */}
          <div className="space-y-2">
            <Label>{t('patientDetail:createTask.patient')}</Label>
            <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={patientSearchOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedPatient ? (
                    <span>{selectedPatient.first_name} {selectedPatient.last_name}</span>
                  ) : (
                    <span className="text-muted-foreground">{t('patientDetail:createTask.searchPatient')}</span>
                  )}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder={t('patientDetail:createTask.searchPlaceholder')}
                    value={patientSearch}
                    onValueChange={setPatientSearch}
                  />
                  <CommandList>
                    {patientSearch.length < 2 ? (
                      <CommandEmpty>{t('patientDetail:createTask.minChars')}</CommandEmpty>
                    ) : isLoadingPatients ? (
                      <CommandEmpty>{t('patientDetail:createTask.searching')}</CommandEmpty>
                    ) : patients.length === 0 ? (
                      <CommandEmpty>{t('patientDetail:createTask.noPatientFound')}</CommandEmpty>
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
                              <p>{patient.first_name} {patient.last_name}</p>
                              {patient.email && (
                                <p className="text-xs text-muted-foreground">{patient.email}</p>
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

          {/* Priority */}
          <div className="space-y-2">
            <Label>{t('patientDetail:createTask.priority')}</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t('patientDetail:createTask.priorityLow')}</SelectItem>
                <SelectItem value="normal">{t('patientDetail:createTask.priorityNormal')}</SelectItem>
                <SelectItem value="high">{t('patientDetail:createTask.priorityHigh')}</SelectItem>
                <SelectItem value="urgent">{t('patientDetail:createTask.priorityUrgent')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('patientDetail:createTask.assignTo')}</Label>
            <Select value={assignedTo || "unassigned"} onValueChange={(v) => setAssignedTo(v === "unassigned" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('patientDetail:createTask.unassigned')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">{t('patientDetail:createTask.unassigned')}</SelectItem>
                {staffMembers.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {getStaffName(staff)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>{t('patientDetail:createTask.dueDate')}</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t('patientDetail:createTask.notes')}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('patientDetail:createTask.notesPlaceholder')}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
            {t('patientDetail:createTask.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={createTask.isPending || !selectedPatient}>
            {createTask.isPending ? t('patientDetail:createTask.creating') : t('patientDetail:createTask.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
