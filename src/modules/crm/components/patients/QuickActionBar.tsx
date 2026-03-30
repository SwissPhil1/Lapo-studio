import { Mail, MessageSquare, StickyNote, ListTodo, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { CreateTaskDialog } from '@/modules/crm/components/tasks/CreateTaskDialog';
import { SendMessageDialog } from '@/modules/crm/components/communications/SendMessageDialog';
import { BookingLinkDialog } from '@/modules/crm/components/patients/BookingLinkDialog';

interface QuickActionBarProps {
  patientId: string;
  patientName: string;
  email: string | null;
  phone: string | null;
  onAddNote: () => void;
  showCreateTask?: boolean;
}

export function QuickActionBar({
  patientId,
  patientName,
  email,
  phone,
  onAddNote,
  showCreateTask = false,
}: QuickActionBarProps) {
  const { t } = useTranslation(['patientDetail']);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  const [bookingLinkOpen, setBookingLinkOpen] = useState(false);

  const { data: activeTask } = useQuery({
    queryKey: ['patient-active-task', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reactivation_tasks')
        .select('id')
        .eq('patient_id', patientId)
        .in('status', ['pending', 'in_progress', 'snoozed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const handleSMS = () => {
    if (phone) {
      window.open(`sms:${phone}`, '_self');
    }
  };

  const nameParts = patientName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSendMessageOpen(true)}
        disabled={!email}
        className="gap-2"
      >
        <Mail className="h-4 w-4" />
        {t('patientDetail:quickActions.email')}
        {activeTask && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded bg-primary/10 text-primary">
            {t('patientDetail:quickActions.linkedTask')}
          </span>
        )}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleSMS}
        disabled={!phone}
        className="gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        {t('patientDetail:quickActions.sms')}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onAddNote}
        className="gap-2"
      >
        <StickyNote className="h-4 w-4" />
        {t('patientDetail:quickActions.note')}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setBookingLinkOpen(true)}
        className="gap-2"
      >
        <CalendarPlus className="h-4 w-4" />
        {t('patientDetail:quickActions.bookingLink')}
      </Button>

      {showCreateTask && (
        <>
          <Button
            variant="default"
            size="sm"
            onClick={() => setCreateTaskOpen(true)}
            className="gap-2"
          >
            <ListTodo className="h-4 w-4" />
            {t('patientDetail:quickActions.createTask')}
          </Button>

          <CreateTaskDialog
            open={createTaskOpen}
            onOpenChange={setCreateTaskOpen}
            defaultPatientId={patientId}
            defaultPatientName={patientName}
          />
        </>
      )}

      <SendMessageDialog
        open={sendMessageOpen}
        onOpenChange={setSendMessageOpen}
        preselectedPatient={{
          id: patientId,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
        }}
        taskId={activeTask?.id}
      />

      <BookingLinkDialog
        open={bookingLinkOpen}
        onOpenChange={setBookingLinkOpen}
        patientId={patientId}
        patientName={patientName}
        patientEmail={email}
      />
    </div>
  );
}
