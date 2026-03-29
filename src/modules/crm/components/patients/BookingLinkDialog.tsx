import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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

// Common treatment types - you can customize these
const TREATMENT_TYPES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'follow-up', label: 'Suivi' },
  { value: 'treatment', label: 'Traitement' },
  { value: 'laser', label: 'Laser' },
  { value: 'injection', label: 'Injection' },
  { value: 'other', label: 'Autre' },
];

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
  const [treatmentType, setTreatmentType] = useState('');
  const [message, setMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      // Generate the booking link URL
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/book/${data.token}`;
      setGeneratedLink(link);
      
      queryClient.invalidateQueries({ queryKey: ['patient-booking-links', patientId] });
      
      toast({
        title: 'Lien créé',
        description: 'Le lien de réservation a été généré avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
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
      toast({ title: 'Copié', description: 'Lien copié dans le presse-papiers' });
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de copier', variant: 'destructive' });
    }
  };

  // Send email via Resend edge function
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      if (!patientEmail || !generatedLink) {
        throw new Error('Email ou lien manquant');
      }

      const htmlBody = `
        <p>Bonjour ${patientName.split(' ')[0]},</p>
        <p>${message || 'Nous vous invitons à réserver votre prochain rendez-vous.'}</p>
        <p>Cliquez sur le lien ci-dessous pour choisir un créneau qui vous convient :</p>
        <p><a href="${generatedLink}" style="color: #2563eb; text-decoration: underline;">Réserver mon rendez-vous</a></p>
        <p>Ce lien est valide pendant ${expiresInDays} jours.</p>
        <p>À bientôt,<br>L'équipe LAPO Skin</p>
      `;

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: patientEmail,
          subject: 'Réservez votre rendez-vous - LAPO Skin',
          html_body: htmlBody,
          patient_id: patientId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Email envoyé', description: 'Le lien a été envoyé au patient.' });
      queryClient.invalidateQueries({ queryKey: ['crm-communication-logs'] });
      queryClient.invalidateQueries({ queryKey: ['patient-timeline', patientId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur lors de l\'envoi', description: error.message, variant: 'destructive' });
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
            Lien de réservation
          </DialogTitle>
          <DialogDescription>
            Créez un lien personnalisé pour {patientName}
          </DialogDescription>
        </DialogHeader>

        {!generatedLink ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="treatment">Type de soin (optionnel)</Label>
              <Select value={treatmentType} onValueChange={setTreatmentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type de soin" />
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
              <Label htmlFor="expires">Validité du lien</Label>
              <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 jour</SelectItem>
                  <SelectItem value="3">3 jours</SelectItem>
                  <SelectItem value="7">7 jours</SelectItem>
                  <SelectItem value="14">14 jours</SelectItem>
                  <SelectItem value="30">30 jours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message personnalisé (optionnel)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Un message à inclure dans l'email..."
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-accent/50 rounded-lg border border-border">
              <Label className="text-xs text-muted-foreground mb-2 block">Lien généré</Label>
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
                  Envoyer par email
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => window.open(generatedLink, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Ouvrir le lien
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {!generatedLink ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Annuler
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
                Générer le lien
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
