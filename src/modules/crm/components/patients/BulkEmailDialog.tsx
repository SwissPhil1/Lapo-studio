import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['patients', 'common']);
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        throw new Error(t('patients:bulkEmailNoPatients'));
      }
      if (!message.trim()) {
        throw new Error(t('patients:bulkEmailNoMessage'));
      }
      if (!subject.trim()) {
        throw new Error(t('patients:bulkEmailNoSubject'));
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
        toast.success(t('patients:bulkEmailSuccess', { count: successCount }));
      } else {
        toast.warning(t('patients:bulkEmailPartial', { success: successCount, fail: failCount }));
      }

      queryClient.invalidateQueries({ queryKey: ['crm-communication-logs'] });
      onSuccess?.();
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('patients:bulkEmailError'));
    },
  });

  const handleClose = () => {
    setSelectedTemplateId('custom');
    setSubject('');
    setMessage('');
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('patients:bulkEmailTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipients summary */}
          <div className="space-y-2">
            <Label>{t('patients:recipients')}</Label>
            {isLoadingPatients ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('common:loading')}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {t('patients:patientsWithEmail', { count: patientsWithEmail.length })}
                  </span>
                  {patientsWithEmail.length > 0 && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
                  )}
                </div>

                {patientsWithoutEmail.length > 0 && (
                  <Alert variant="default" className="border-amber-500/30 bg-amber-500/10">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-sm">
                      {t('patients:patientsWithoutEmail', { count: patientsWithoutEmail.length })}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Template selector */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label>{t('patients:template')}</Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('patients:chooseTemplate')} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="custom">{t('patients:customMessage')}</SelectItem>

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
                {t('patients:mergeTagsHint')}
              </p>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label>{t('patients:subject')}</Label>
            <Input
              value={subject}
              onChange={(e) => { setSubject(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.subject; return n; }); }}
              placeholder={t('patients:subjectPlaceholder')}
            />
            {errors.subject && <p className="text-xs text-destructive mt-1">{errors.subject}</p>}
          </div>

          {/* Message content */}
          <div className="space-y-2">
            <Label>{t('patients:message')}</Label>
            <Textarea
              value={message}
              onChange={(e) => { setMessage(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.message; return n; }); }}
              placeholder={t('patients:messagePlaceholder')}
              rows={6}
            />
            {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common:cancel')}
          </Button>
          <Button
            onClick={() => {
              const newErrors: Record<string, string> = {};
              if (!subject.trim()) newErrors.subject = t('patients:bulkEmailNoSubject');
              if (!message.trim()) newErrors.message = t('patients:bulkEmailNoMessage');
              if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
              }
              setErrors({});
              sendMutation.mutate();
            }}
            disabled={patientsWithEmail.length === 0 || sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t('patients:sending')}</>
            ) : (
              <>{t('patients:sendToPatients', { count: patientsWithEmail.length })}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
