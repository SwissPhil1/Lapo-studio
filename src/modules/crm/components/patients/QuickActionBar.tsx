import { Mail, MessageSquare, StickyNote, ListTodo, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
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
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  const [bookingLinkOpen, setBookingLinkOpen] = useState(false);
  
  // Fetch active task for this patient to link email sends
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

  // Split patient name for SendMessageDialog
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
        Email
        {activeTask && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded bg-primary/10 text-primary">
            +tâche
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
        SMS
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onAddNote}
        className="gap-2"
      >
        <StickyNote className="h-4 w-4" />
        Note
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setBookingLinkOpen(true)}
        className="gap-2"
      >
        <CalendarPlus className="h-4 w-4" />
        Lien RDV
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
            Créer tâche
          </Button>
          
          <CreateTaskDialog 
            open={createTaskOpen}
            onOpenChange={setCreateTaskOpen}
            defaultPatientId={patientId}
            defaultPatientName={patientName}
          />
        </>
      )}

      {/* Send Message Dialog with task linking */}
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

      {/* Booking Link Dialog */}
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
