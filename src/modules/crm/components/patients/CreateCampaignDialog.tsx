import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useToast } from '@/shared/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Megaphone, Send, Clock, Users, Mail, MessageSquare, Sparkles } from 'lucide-react';
import { AICampaignContentDialog } from '@/modules/crm/components/campaigns/AICampaignContentDialog';

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientIds: string[];
  aiQuery?: string;
  patientCount: number;
  onSuccess?: () => void;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export function CreateCampaignDialog({
  open,
  onOpenChange,
  patientIds,
  aiQuery,
  patientCount,
  onSuccess,
}: CreateCampaignDialogProps) {
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [templateId, setTemplateId] = useState<string>('custom');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [sendOption, setSendOption] = useState<'now' | 'later'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch email templates
  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ['email-templates-campaign'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('id, name, subject, body')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      // 1. Create the segment first
      const segmentData: Record<string, unknown> = {
        name: `Segment: ${name}`,
        type: aiQuery ? 'dynamic' : 'static',
      };

      if (aiQuery) {
        segmentData.ai_query = aiQuery;
        segmentData.filter_json = { ai_query: aiQuery };
      } else {
        segmentData.patient_ids = patientIds;
        segmentData.filter_json = { patient_ids: patientIds };
      }

      const { data: segment, error: segmentError } = await supabase
        .from('crm_segments')
        .insert([segmentData])
        .select('id')
        .single();

      if (segmentError) throw segmentError;

      // 2. Get template content
      let messageTemplate = customMessage;
      if (templateId !== 'custom') {
        const template = templates.find(t => t.id === templateId);
        if (template) {
          messageTemplate = template.body;
        }
      }

      // 3. Create the campaign
      const campaignData: Record<string, unknown> = {
        name,
        segment_id: segment.id,
        channel,
        message_template: messageTemplate,
        status: sendOption === 'now' ? 'sending' : 'scheduled',
      };

      if (sendOption === 'later' && scheduledDate) {
        campaignData.scheduled_at = new Date(scheduledDate).toISOString();
      }

      const { data: campaign, error: campaignError } = await supabase
        .from('crm_campaigns')
        .insert([campaignData])
        .select('id')
        .single();

      if (campaignError) throw campaignError;

      // 4. If sending now, trigger the appropriate bulk send
      if (sendOption === 'now') {
        const selectedTemplate = templateId !== 'custom' ? templates.find(t => t.id === templateId) : null;

        if (channel === 'email') {
          const { error: sendError } = await supabase.functions.invoke('send-bulk-email', {
            body: {
              patient_ids: patientIds,
              subject: templateId === 'custom' ? customSubject : selectedTemplate?.subject,
              message: templateId === 'custom' ? customMessage : selectedTemplate?.body,
              template_id: templateId !== 'custom' ? templateId : undefined,
              campaign_id: campaign.id,
            },
          });
          if (sendError) throw sendError;
        } else {
          // SMS or WhatsApp
          const { error: sendError } = await supabase.functions.invoke('send-bulk-sms', {
            body: {
              patient_ids: patientIds,
              message: templateId === 'custom' ? customMessage : messageTemplate,
              channel,
              campaign_id: campaign.id,
            },
          });
          if (sendError) throw sendError;
        }

        // Update campaign status
        await supabase
          .from('crm_campaigns')
          .update({ status: 'sent' })
          .eq('id', campaign.id);
      }

      return campaign;
    },
    onSuccess: () => {
      toast({
        title: sendOption === 'now' ? 'Campagne envoyée' : 'Campagne programmée',
        description: sendOption === 'now' 
          ? `La campagne "${name}" a été envoyée à ${patientCount} patients.`
          : `La campagne "${name}" sera envoyée le ${new Date(scheduledDate).toLocaleDateString('fr-FR')}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['crm-campaigns'] });
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setName('');
    setChannel('email');
    setTemplateId('custom');
    setCustomSubject('');
    setCustomMessage('');
    setSendOption('now');
    setScheduledDate('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({ title: 'Erreur', description: 'Veuillez entrer un nom pour la campagne.', variant: 'destructive' });
      return;
    }
    
    if (templateId === 'custom' && (!customSubject.trim() || !customMessage.trim())) {
      toast({ title: 'Erreur', description: 'Veuillez remplir le sujet et le message.', variant: 'destructive' });
      return;
    }
    
    if (sendOption === 'later' && !scheduledDate) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner une date d\'envoi.', variant: 'destructive' });
      return;
    }

    createCampaignMutation.mutate();
  };

  const selectedTemplate = templates.find(t => t.id === templateId);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Créer une campagne
          </DialogTitle>
          <DialogDescription>
            Créez une campagne pour {patientCount} patients.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Nom de la campagne</Label>
            <Input
              id="campaign-name"
              placeholder="ex: Réactivation Botox Janvier"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Channel Selection */}
          <div className="space-y-2">
            <Label>Canal</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={channel === 'email' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => setChannel('email')}
              >
                <Mail className="h-4 w-4" /> Email
              </Button>
              <Button
                type="button"
                variant={channel === 'sms' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => setChannel('sms')}
              >
                <MessageSquare className="h-4 w-4" /> SMS
              </Button>
              <Button
                type="button"
                variant={channel === 'whatsapp' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => setChannel('whatsapp')}
              >
                <MessageSquare className="h-4 w-4" /> WhatsApp
              </Button>
            </div>
          </div>

          {/* Patient Count */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium">{patientCount} destinataires</span>
              {aiQuery && (
                <span className="text-muted-foreground text-xs ml-auto">
                  Segment dynamique
                </span>
              )}
            </div>
          </div>

          {/* Template Selection — email only */}
          {channel === 'email' && (
            <>
              <div className="space-y-2">
                <Label>Modèle d'email</Label>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un modèle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Message personnalisé</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Subject & Message */}
              {templateId === 'custom' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Sujet</Label>
                    <Input
                      id="subject"
                      placeholder="Sujet de l'email"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Contenu de l'email..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tags disponibles: {'{first_name}'}, {'{last_name}'}, {'{email}'}
                    </p>
                  </div>
                </>
              ) : selectedTemplate && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Sujet:</span> {selectedTemplate.subject}
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-3">
                    {selectedTemplate.body.replace(/<[^>]*>/g, '').substring(0, 150)}...
                  </div>
                </div>
              )}
            </>
          )}

          {/* SMS/WhatsApp Message */}
          {channel !== 'email' && (
            <div className="space-y-2">
              <Label htmlFor="sms-message">Message {channel === 'sms' ? 'SMS' : 'WhatsApp'}</Label>
              <Textarea
                id="sms-message"
                placeholder={channel === 'sms' ? 'Écrivez votre SMS (160 caractères max)...' : 'Écrivez votre message WhatsApp...'}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                maxLength={channel === 'sms' ? 160 : undefined}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Tags: {'{first_name}'}, {'{last_name}'}
                </p>
                {channel === 'sms' && (
                  <p className="text-xs text-muted-foreground">{customMessage.length}/160</p>
                )}
              </div>
            </div>
          )}

          {/* AI Content Generation */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => setAiDialogOpen(true)}
          >
            <Sparkles className="h-4 w-4" /> Générer avec l'IA
          </Button>

          {/* Send Options */}
          <div className="space-y-3">
            <Label>Quand envoyer?</Label>
            <RadioGroup
              value={sendOption}
              onValueChange={(v) => setSendOption(v as 'now' | 'later')}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="now" id="now" />
                <Label htmlFor="now" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Send className="h-4 w-4 text-primary" />
                  Envoyer maintenant
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="later" id="later" />
                <Label htmlFor="later" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Clock className="h-4 w-4" />
                  Programmer pour plus tard
                </Label>
              </div>
            </RadioGroup>
          </div>

          {sendOption === 'later' && (
            <div className="space-y-2">
              <Label htmlFor="schedule-date">Date et heure d'envoi</Label>
              <Input
                id="schedule-date"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createCampaignMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={createCampaignMutation.isPending}
            >
              {createCampaignMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : sendOption === 'now' ? (
                <Send className="h-4 w-4 mr-2" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              {sendOption === 'now' ? 'Envoyer la campagne' : 'Programmer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <AICampaignContentDialog
      open={aiDialogOpen}
      onOpenChange={setAiDialogOpen}
      channel={channel}
      onApply={(content) => {
        if (content.subject) setCustomSubject(content.subject);
        if (content.body) setCustomMessage(content.body);
        if (content.message) setCustomMessage(content.message);
        setTemplateId('custom');
      }}
    />
    </>
  );
}
