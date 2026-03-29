export interface CommunicationLog {
  id: string;
  patient_id: string;
  channel: string;
  subject: string | null;
  message_preview: string | null;
  full_message: string | null;
  sent_at: string;
  status: string;
  direction: string | null;
  // Email tracking fields
  resend_email_id?: string | null;
  delivered_at?: string | null;
  opened_at?: string | null;
  opened_count?: number | null;
  clicked_at?: string | null;
  clicked_count?: number | null;
  bounced_at?: string | null;
  bounce_reason?: string | null;
  // SMS/WhatsApp tracking
  sms_provider_id?: string | null;
  whatsapp_message_id?: string | null;
  twilio_message_sid?: string | null;
  variant_id?: string | null;
  patients?: {
    first_name: string;
    last_name: string;
    email: string | null;
  };
}

export type ChannelFilter = 'all' | 'email' | 'sms' | 'whatsapp' | 'phone';
export type StatusFilter = 'all' | 'sent' | 'delivered' | 'failed';
export type DirectionFilter = 'all' | 'inbound' | 'outbound';
export type PeriodFilter = 'all' | 'today' | 'week' | 'month';

export const channelLabels: Record<string, string> = {
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  phone: 'Appel',
};

export const statusLabels: Record<string, string> = {
  sent: 'Envoyé',
  delivered: 'Délivré',
  read: 'Lu',
  failed: 'Échec',
  pending: 'En attente',
};

export const statusColors: Record<string, string> = {
  sent: 'bg-muted text-muted-foreground',
  delivered: 'bg-success/10 text-success',
  read: 'bg-primary/10 text-primary',
  failed: 'bg-destructive/10 text-destructive',
  pending: 'bg-warning/10 text-warning',
};
