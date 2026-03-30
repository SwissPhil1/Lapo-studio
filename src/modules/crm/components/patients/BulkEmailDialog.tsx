import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Mail, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getTemplateCategories } from '@/shared/lib/emailMergeTags';

interface PatientBasic {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

interface BulkEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPatientIds: string[];
  onSuccess?: () => void;
}

interface EmailTemplate {
  id: string;
  key: string;
  name: string;
  subject: string;
  body: string;
  category: string | null;
}

export function BulkEmailDialog({ 
  open, 
  onOpenChange, 
  selectedPatientIds,
  onSuccess 
}: BulkEmailDialogProps) {
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Fetch patient details for selected IDs
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery({
    queryKey: ['bulk-email-patients', selectedPatientIds],
    queryFn: async () => {
      if (selectedPatientIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email')
        .in('id', selectedPatientIds);
      
      if (error) throw error;
      return data as PatientBasic[];
    },
    enabled: open && selectedPatientIds.length > 0,
  });

  // Fetch email templates
  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates-bulk'],
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

  const patientsWithEmail = patients.filter(p => p.email);
  const patientsWithoutEmail = patients.filter(p => !p.email);

  // Group templates by category
  const templatesByCategory = templates.reduce<Record<string, EmailTemplate[]>>((acc, template) => {
    const category = template.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {});

  // Handle template change
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId === 'custom') {
      setSubject('');
      setMessage('');
    } else {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setSubject(template.subject);
        setMessage(template.body);
      }
    }
  };

  // Send bulk email mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (patientsWithEmail.length === 0) {
        throw new Error('Aucun patient avec email sélectionné');
      }
      if (!message.trim()) {
        throw new Error('Veuillez entrer un message');
      }
      if (!subject.trim()) {
        throw new Error('Veuillez entrer un objet');
      }

      const { data, error } = await supabase.functions.invoke('send-bulk-email', {
        body: {
          patient_ids: patientsWithEmail.map(p => p.id),
          subject,
          message,
          template_id: selectedTemplateId !== 'custom' ? selectedTemplateId : undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      const successCount = data?.success_count || 0;
      const failCount = data?.fail_count || 0;
      
      if (failCount === 0) {
        toast.success(`${successCount} email${successCount > 1 ? 's' : ''} envoyé${successCount > 1 ? 's' : ''} avec succès`);
      } else {
        toast.warning(`${successCount} envoyé${successCount > 1 ? 's' : ''}, ${failCount} échec${failCount > 1 ? 's' : ''}`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['crm-communication-logs'] });
      onSuccess?.();
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de l\'envoi des emails');
    },
  });

  const handleClose = () => {
    setSelectedTemplateId('custom');
    setSubject('');
    setMessage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Envoyer un email groupé
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipients summary */}
          <div className="space-y-2">
            <Label>Destinataires</Label>
            {isLoadingPatients ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement...
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {patientsWithEmail.length} patient{patientsWithEmail.length > 1 ? 's' : ''} avec email
                  </span>
                  {patientsWithEmail.length > 0 && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
                  )}
                </div>
                
                {patientsWithoutEmail.length > 0 && (
                  <Alert variant="default" className="border-amber-500/30 bg-amber-500/10">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-sm">
                      {patientsWithoutEmail.length} patient{patientsWithoutEmail.length > 1 ? 's' : ''} sans email (non inclus)
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Template selector */}
          {templates.length > 0 && (
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
                        {getTemplateCategories()[category] || category}
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
              <p className="text-xs text-muted-foreground">
                Les merge tags ({'{first_name}'}, {'{treatment_name}'}, etc.) seront personnalisés pour chaque patient.
              </p>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label>Objet</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Objet de l'email..."
            />
          </div>

          {/* Message content */}
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              rows={6}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button 
            onClick={() => sendMutation.mutate()} 
            disabled={patientsWithEmail.length === 0 || !message.trim() || !subject.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Envoi en cours...</>
            ) : (
              <>Envoyer à {patientsWithEmail.length} patient{patientsWithEmail.length > 1 ? 's' : ''}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
