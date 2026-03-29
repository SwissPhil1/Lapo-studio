import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Mail, MessageSquare, Phone, Search, User, CalendarIcon } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import { 
  getPatientTreatmentInfo, 
  resolveMergeTags, 
  TEMPLATE_CATEGORIES,
  type TreatmentInfo 
} from '@/shared/lib/emailMergeTags';

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  preselectedPatient?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  };
  /** If provided, the associated reactivation task will be snoozed after sending */
  taskId?: string;
}

// Quick follow-up options in days
const FOLLOW_UP_OPTIONS = [
  { label: '1 semaine', days: 7 },
  { label: '2 semaines', days: 14 },
  { label: '1 mois', days: 30 },
  { label: '3 mois', days: 90 },
];

type Channel = 'email' | 'sms' | 'phone';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
}

interface EmailTemplate {
  id: string;
  key: string;
  name: string;
  subject: string;
  body: string;
  category: string | null;
}

export function SendMessageDialog({ open, onOpenChange, onSuccess, preselectedPatient, taskId }: SendMessageDialogProps) {
  const queryClient = useQueryClient();
  const [patientOpen, setPatientOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(preselectedPatient || null);
  const [channel, setChannel] = useState<Channel>('email');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [treatmentInfo, setTreatmentInfo] = useState<TreatmentInfo | null>(null);
  const [isLoadingTreatment, setIsLoadingTreatment] = useState(false);
  const [followUpDate, setFollowUpDate] = useState<Date | null>(addDays(new Date(), 30)); // Default: 1 month
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Fetch treatment info when patient changes
  useEffect(() => {
    async function fetchTreatmentInfo() {
      if (!selectedPatient) {
        setTreatmentInfo(null);
        return;
      }
      
      setIsLoadingTreatment(true);
      try {
        const info = await getPatientTreatmentInfo(selectedPatient.id);
        setTreatmentInfo(info);
      } catch (error) {
        console.error('Error fetching treatment info:', error);
        setTreatmentInfo(null);
      } finally {
        setIsLoadingTreatment(false);
      }
    }
    
    fetchTreatmentInfo();
  }, [selectedPatient?.id]);

  // Fetch patients for search
  const { data: patients = [] } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: async () => {
      let query = supabase
        .from('patients')
        .select('id, first_name, last_name, email, phone')
        .order('last_name')
        .limit(20);
      
      if (patientSearch) {
        query = query.or(`first_name.ilike.%${patientSearch}%,last_name.ilike.%${patientSearch}%,email.ilike.%${patientSearch}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Patient[];
    },
    enabled: open,
  });

  // Fetch email templates with category
  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates-with-category'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('id, key, name, subject, body, category')
        .order('category')
        .order('name');
      
      if (error) throw error;
      return data as EmailTemplate[];
    },
    enabled: open,
  });

  // Group templates by category
  const templatesByCategory = templates.reduce<Record<string, EmailTemplate[]>>((acc, template) => {
    const category = template.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {});

  // Apply template with dynamic merge tags
  const applyTemplate = (template: EmailTemplate) => {
    if (!selectedPatient) {
      setSubject(template.subject);
      setMessage(template.body);
      return;
    }

    const mergeData = {
      patient: {
        id: selectedPatient.id,
        first_name: selectedPatient.first_name,
        last_name: selectedPatient.last_name,
        email: selectedPatient.email || undefined,
        phone: selectedPatient.phone || undefined,
      },
      treatment: treatmentInfo,
    };

    const processedSubject = resolveMergeTags(template.subject, mergeData);
    const processedBody = resolveMergeTags(template.body, mergeData);
    
    setSubject(processedSubject);
    setMessage(processedBody);
  };

  // Handle template change
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId === 'custom') {
      setSubject('');
      setMessage('');
    } else {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        applyTemplate(template);
      }
    }
  };

  // Re-apply template when treatment info is loaded
  useEffect(() => {
    if (selectedTemplateId !== 'custom' && treatmentInfo && !isLoadingTreatment) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        applyTemplate(template);
      }
    }
  }, [treatmentInfo, isLoadingTreatment]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatient) throw new Error('Veuillez sélectionner un patient');
      if (!message.trim()) throw new Error('Veuillez entrer un message');
      
      const followUpDateStr = followUpDate ? format(followUpDate, 'yyyy-MM-dd') : null;
      
      // For email, use the edge function to actually send via Resend
      if (channel === 'email') {
        if (!selectedPatient.email) {
          throw new Error('Ce patient n\'a pas d\'adresse email');
        }
        
        const { data, error } = await supabase.functions.invoke('send-email', {
          body: {
            to: selectedPatient.email,
            subject: subject || 'Message de LAPO Skin',
            html_body: message,
            patient_id: selectedPatient.id,
            template_id: selectedTemplateId !== 'custom' ? selectedTemplateId : undefined,
            follow_up_date: followUpDateStr,
          },
        });
        
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        
        return { channel: 'email', followUpDate: followUpDateStr };
      }
      
      // For SMS, use the send-sms edge function
      if (channel === 'sms') {
        if (!selectedPatient.phone) {
          throw new Error('Ce patient n\'a pas de numéro de téléphone');
        }

        const { data, error } = await supabase.functions.invoke('send-sms', {
          body: {
            to: selectedPatient.phone,
            message,
            patient_id: selectedPatient.id,
            channel: 'sms',
            template_id: selectedTemplateId !== 'custom' ? selectedTemplateId : undefined,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        return { channel: 'sms', followUpDate: followUpDateStr };
      }

      // For phone call notes, just log it
      const { error } = await supabase
        .from('crm_communication_logs')
        .insert({
          patient_id: selectedPatient.id,
          channel,
          subject: null,
          message_preview: message.substring(0, 100),
          full_message: message,
          status: 'sent',
          direction: 'outbound',
          follow_up_date: followUpDateStr,
        });

      if (error) throw error;
      return { channel, followUpDate: followUpDateStr };
    },
    onSuccess: async (result) => {
      // Build success message
      let successMessage = result.channel === 'email' ? 'Email envoyé' : result.channel === 'sms' ? 'SMS envoyé' : 'Note enregistrée';
      if (result.followUpDate) {
        const followUpFormatted = format(new Date(result.followUpDate), 'd MMMM yyyy', { locale: fr });
        successMessage += ` • Rappel le ${followUpFormatted}`;
      }
      
      // If there's an associated task, snooze it and log the attempt
      if (taskId && followUpDate) {
        try {
          // Use direct update since we don't have access to the hook here
          const { data: task } = await supabase
            .from('reactivation_tasks')
            .select('attempt_count, notes')
            .eq('id', taskId)
            .single();
          
          const newAttemptCount = (task?.attempt_count || 0) + 1;
          const timestamp = new Date().toLocaleString('fr-FR', { 
            day: '2-digit', 
            month: 'short', 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          const channelLabel = channel === 'email' ? 'Email' : channel === 'sms' ? 'SMS' : 'Appel';
          const noteText = `[${channelLabel} - ${timestamp}] Rappel envoyé`;
          const newNotes = `${task?.notes || ''}\n${noteText}`.trim();
          
          await supabase
            .from('reactivation_tasks')
            .update({
              attempt_count: newAttemptCount,
              last_attempt_at: new Date().toISOString(),
              notes: newNotes,
              status: 'snoozed',
              snoozed_until: format(followUpDate, 'yyyy-MM-dd'),
            })
            .eq('id', taskId);
          
          queryClient.invalidateQueries({ queryKey: ['reactivation-tasks'] });
          queryClient.invalidateQueries({ queryKey: ['reactivation-task-counts'] });
          queryClient.invalidateQueries({ queryKey: ['patient-tasks'] });
        } catch (err) {
          console.error('Error updating task:', err);
        }
      }
      
      toast.success(successMessage);
      
      // Invalidate all relevant queries so UI updates immediately
      queryClient.invalidateQueries({ queryKey: ['crm-communication-logs'] });
      queryClient.invalidateQueries({ queryKey: ['patient-communications'] });
      
      // Refresh patient timeline (Activité tab) and activity widgets
      if (selectedPatient) {
        queryClient.invalidateQueries({ queryKey: ['patient-timeline', selectedPatient.id] });
        queryClient.invalidateQueries({ queryKey: ['patient-recent-comms', selectedPatient.id] });
      }
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      
      onSuccess?.();
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de l\'envoi du message');
    },
  });

  const handleClose = () => {
    setSelectedPatient(preselectedPatient || null);
    setChannel('email');
    setSelectedTemplateId('custom');
    setSubject('');
    setMessage('');
    setPatientSearch('');
    setTreatmentInfo(null);
    setFollowUpDate(addDays(new Date(), 30)); // Reset to default
    setCalendarOpen(false);
    onOpenChange(false);
  };

  const handleQuickFollowUp = (days: number) => {
    setFollowUpDate(addDays(new Date(), days));
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientOpen(false);
    // Template will be re-applied when treatment info loads via useEffect
  };

  const channelConfig = {
    email: { icon: Mail, label: 'Email', placeholder: 'Écrivez votre email...' },
    sms: { icon: MessageSquare, label: 'SMS', placeholder: 'Écrivez votre SMS (160 caractères max)...' },
    phone: { icon: Phone, label: 'Note d\'appel', placeholder: 'Notes de l\'appel téléphonique...' },
  };

  const ChannelIcon = channelConfig[channel].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ChannelIcon className="h-5 w-5" />
            Envoyer un message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          {/* Patient selector */}
          <div className="space-y-2">
            <Label>Patient</Label>
            <Popover open={patientOpen} onOpenChange={setPatientOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={patientOpen}
                  className="w-full justify-start"
                >
                  {selectedPatient ? (
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {selectedPatient.first_name} {selectedPatient.last_name}
                      {isLoadingTreatment && <Loader2 className="h-3 w-3 animate-spin ml-2" />}
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Rechercher un patient...
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Rechercher par nom ou email..." 
                    value={patientSearch}
                    onValueChange={setPatientSearch}
                  />
                  <CommandList>
                    <CommandEmpty>Aucun patient trouvé.</CommandEmpty>
                    <CommandGroup>
                      {patients.map((patient) => (
                        <CommandItem
                          key={patient.id}
                          value={`${patient.first_name} ${patient.last_name}`}
                          onSelect={() => handlePatientSelect(patient)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{patient.first_name} {patient.last_name}</span>
                            <span className="text-xs text-muted-foreground">{patient.email || 'Pas d\'email'}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            {/* Treatment info indicator */}
            {selectedPatient && treatmentInfo && !isLoadingTreatment && (
              <p className="text-xs text-muted-foreground">
                Dernier soin : {treatmentInfo.treatment_name} • Rappel : {treatmentInfo.recall_days} jours
              </p>
            )}
          </div>

          {/* Channel selector */}
          <div className="space-y-2">
            <Label>Canal</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </span>
                </SelectItem>
                <SelectItem value="sms">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> SMS
                  </span>
                </SelectItem>
                <SelectItem value="phone">
                  <span className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Note d'appel
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template selector - grouped by category */}
          {channel === 'email' && templates.length > 0 && (
            <div className="space-y-2">
              <Label>Modèle</Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un modèle..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="custom">Message personnalisé</SelectItem>
                  
                  {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                    <SelectGroup key={category}>
                      <SelectLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                        {TEMPLATE_CATEGORIES[category] || category}
                      </SelectLabel>
                      {categoryTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject (for email only) */}
          {channel === 'email' && (
            <div className="space-y-2">
              <Label>Objet</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Objet de l'email..."
              />
            </div>
          )}

          {/* Message content */}
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={channelConfig[channel].placeholder}
              rows={channel === 'sms' ? 3 : 5}
              maxLength={channel === 'sms' ? 160 : undefined}
            />
            {channel === 'sms' && (
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/160 caractères
              </p>
            )}
          </div>

          {/* Follow-up date selector */}
          <div className="space-y-2">
            <Label>Prochain rappel dans</Label>
            <div className="flex flex-wrap gap-2">
              {FOLLOW_UP_OPTIONS.map((option) => (
                <Button
                  key={option.days}
                  type="button"
                  variant={followUpDate && Math.abs(followUpDate.getTime() - addDays(new Date(), option.days).getTime()) < 86400000 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickFollowUp(option.days)}
                >
                  {option.label}
                </Button>
              ))}
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(!followUpDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Personnalisé
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={followUpDate || undefined}
                    onSelect={(date) => {
                      setFollowUpDate(date || null);
                      setCalendarOpen(false);
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {followUpDate && (
              <p className="text-xs text-muted-foreground">
                Rappel prévu le {format(followUpDate, 'd MMMM yyyy', { locale: fr })}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button 
            onClick={() => sendMutation.mutate()} 
            disabled={!selectedPatient || !message.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Envoi...</>
            ) : (
              <>Envoyer</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
