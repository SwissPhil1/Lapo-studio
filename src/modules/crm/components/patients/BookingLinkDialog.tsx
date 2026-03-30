import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { useToast } from '@/shared/hooks/use-toast';
import { CalendarPlus, Copy, Check, Send, Loader2, ExternalLink } from 'lucide-react';

interface BookingLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  patientEmail: string | null;
}

function generateToken(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function BookingLinkDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  patientEmail,
}: BookingLinkDialogProps) {
  const { t } = useTranslation(['patientDetail']);
  const [treatmentType, setTreatmentType] = useState('');
  const [message, setMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const TREATMENT_TYPES = [
    { value: 'consultation', label: t('patientDetail:bookingLink.consultation') },
    { value: 'follow-up', label: t('patientDetail:bookingLink.followUp') },
    { value: 'treatment', label: t('patientDetail:bookingLink.treatment') },
    { value: 'laser', label: t('patientDetail:bookingLink.laser') },
    { value: 'injection', label: t('patientDetail:bookingLink.injection') },
    { value: 'other', label: t('patientDetail:bookingLink.other') },
  ];

  // Fetch protocols for treatment type suggestions
  const { data: protocols } = useQuery({
    queryKey: ['treatment-protocols'],
    queryFn: async () => {
      const { data } = await supabase
        .from('treatment_protocols')
        .select('treatment_type')
        .order('treatment_type');
      return data || [];
    },
  });

  const createLinkMutation = useMutation({
    mutationFn: async () => {
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('crm_booking_links')
        .insert({
          patient_id: patientId,
          token,
          treatment_type: treatmentType || null,
          message: message || null,
          expires_at: expiresAt.toISOString(),
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/book/${data.token}`;
      setGeneratedLink(link);

      queryClient.invalidateQueries({ queryKey: ['patient-booking-links', patientId] });

      toast({
        title: t('patientDetail:bookingLink.linkCreated'),
        description: t('patientDetail:bookingLink.linkCreatedDesc'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('patientDetail:bookingLink.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCopyLink = async () => {
    if (!generatedLink) return;

    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: t('patientDetail:bookingLink.copied'), description: t('patientDetail:bookingLink.copiedDesc') });
    } catch {
      toast({ title: t('patientDetail:bookingLink.error'), description: t('patientDetail:bookingLink.copyError'), variant: 'destructive' });
    }
  };

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      if (!patientEmail || !generatedLink) {
        throw new Error(t('patientDetail:bookingLink.emailMissingError'));
      }

      const firstName = patientName.split(' ')[0];
      const htmlBody = `
        <p>${t('patientDetail:bookingLink.emailGreeting', { name: firstName })}</p>
        <p>${message || t('patientDetail:bookingLink.emailDefaultMessage')}</p>
        <p><a href="${generatedLink}" style="color: #2563eb; text-decoration: underline;">${t('patientDetail:bookingLink.emailCta')}</a></p>
        <p>${t('patientDetail:bookingLink.emailValidityNote', { days: expiresInDays })}</p>
        <p>${t('patientDetail:bookingLink.emailSignoff')}<br>${t('patientDetail:bookingLink.emailTeam')}</p>
      `;

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: patientEmail,
          subject: t('patientDetail:bookingLink.emailSubject'),
          html_body: htmlBody,
          patient_id: patientId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: t('patientDetail:bookingLink.emailSent'), description: t('patientDetail:bookingLink.emailSentDesc') });
      queryClient.invalidateQueries({ queryKey: ['crm-communication-logs'] });
      queryClient.invalidateQueries({ queryKey: ['patient-timeline', patientId] });
    },
    onError: (error: Error) => {
      toast({ title: t('patientDetail:bookingLink.sendError'), description: error.message, variant: 'destructive' });
    },
  });

  const handleSendEmail = () => {
    sendEmailMutation.mutate();
  };

  const handleClose = () => {
    setTreatmentType('');
    setMessage('');
    setExpiresInDays('7');
    setGeneratedLink(null);
    setCopied(false);
    onOpenChange(false);
  };

  const treatmentOptions = protocols?.length
    ? protocols.map(p => ({ value: p.treatment_type, label: p.treatment_type }))
    : TREATMENT_TYPES;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-primary" />
            {t('patientDetail:bookingLink.title')}
          </DialogTitle>
          <DialogDescription>
            {t('patientDetail:bookingLink.description', { name: patientName })}
          </DialogDescription>
        </DialogHeader>

        {!generatedLink ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="treatment">{t('patientDetail:bookingLink.treatmentType')}</Label>
              <Select value={treatmentType} onValueChange={setTreatmentType}>
                <SelectTrigger>
                  <SelectValue placeholder={t('patientDetail:bookingLink.treatmentPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {treatmentOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires">{t('patientDetail:bookingLink.validity')}</Label>
              <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('patientDetail:bookingLink.day1')}</SelectItem>
                  <SelectItem value="3">{t('patientDetail:bookingLink.day3')}</SelectItem>
                  <SelectItem value="7">{t('patientDetail:bookingLink.day7')}</SelectItem>
                  <SelectItem value="14">{t('patientDetail:bookingLink.day14')}</SelectItem>
                  <SelectItem value="30">{t('patientDetail:bookingLink.day30')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t('patientDetail:bookingLink.customMessage')}</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('patientDetail:bookingLink.customMessagePlaceholder')}
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-accent/50 rounded-lg border border-border">
              <Label className="text-xs text-muted-foreground mb-2 block">{t('patientDetail:bookingLink.generatedLink')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {patientEmail && (
                <Button
                  onClick={handleSendEmail}
                  className="gap-2"
                  disabled={sendEmailMutation.isPending}
                >
                  {sendEmailMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {t('patientDetail:bookingLink.sendByEmail')}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => window.open(generatedLink, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                {t('patientDetail:bookingLink.openLink')}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {!generatedLink ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                {t('patientDetail:bookingLink.cancel')}
              </Button>
              <Button
                onClick={() => createLinkMutation.mutate()}
                disabled={createLinkMutation.isPending}
                className="gap-2"
              >
                {createLinkMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarPlus className="h-4 w-4" />
                )}
                {t('patientDetail:bookingLink.generate')}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              {t('patientDetail:bookingLink.close')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
