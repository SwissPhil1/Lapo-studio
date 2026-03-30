import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared/lib/supabase';
import { Mail, Phone, MessageSquare, CheckCircle, Eye, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface CommunicationsHistoryProps {
  patientId: string;
}

interface CommunicationLog {
  id: string;
  channel: string;
  subject: string | null;
  message_preview: string | null;
  full_message: string | null;
  status: string;
  direction: string;
  created_at: string;
  opened_at: string | null;
  clicked_at: string | null;
}

// Safety: coerce any non-string value (e.g. JSON object from Supabase) to string
function safeString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return String(value);
}

export function CommunicationsHistory({ patientId }: CommunicationsHistoryProps) {
  const { t, i18n } = useTranslation(['communications']);
  const dateLocale = i18n.language === 'fr' ? frLocale : enUS;
  const [selectedMessage, setSelectedMessage] = useState<CommunicationLog | null>(null);

  const channelConfig: Record<string, { icon: typeof Mail; label: string; color: string }> = {
    email: { icon: Mail, label: t('communications:channelEmail'), color: 'text-info' },
    sms: { icon: MessageSquare, label: t('communications:channelSms'), color: 'text-success' },
    phone: { icon: Phone, label: t('communications:channelCall'), color: 'text-warning' },
  };

  const statusConfig: Record<string, { label: string; className: string }> = {
    sent: { label: t('communications:statusSent'), className: 'bg-info/15 text-info' },
    delivered: { label: t('communications:statusDelivered'), className: 'bg-success/15 text-success' },
    opened: { label: t('communications:statusOpened'), className: 'bg-success/15 text-success' },
    clicked: { label: t('communications:statusClicked'), className: 'bg-primary/10 text-primary' },
    failed: { label: t('communications:statusFailed'), className: 'bg-destructive/10 text-destructive' },
    bounced: { label: t('communications:statusBounced'), className: 'bg-destructive/10 text-destructive' },
  };

  const { data: communications, isLoading } = useQuery({
    queryKey: ['patient-communications', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_communication_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as CommunicationLog[];
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded" />
        ))}
      </div>
    );
  }

  if (!communications || communications.length === 0) {
    return (
      <div className="card-elevated p-8 text-center text-muted-foreground">
        <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>{t('communications:noCommunicationsRecorded')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {communications.map((comm) => {
          const channel = channelConfig[comm.channel] || channelConfig.email;
          const status = statusConfig[comm.status] || statusConfig.sent;
          const ChannelIcon = channel.icon;
          const subject = safeString(comm.subject);
          const preview = safeString(comm.message_preview);

          return (
            <div
              key={comm.id}
              className="card-elevated p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => setSelectedMessage(comm)}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${channel.color}`}>
                  <ChannelIcon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {subject ? (
                      <span className="font-medium text-foreground truncate">
                        {subject}
                      </span>
                    ) : (
                      <span className="font-medium text-foreground">
                        {channel.label}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs rounded-full ${status.className}`}>
                      {status.label}
                    </span>
                    {comm.opened_at && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        {t('communications:statusOpened')}
                      </span>
                    )}
                  </div>

                  {preview && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {preview}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(parseISO(comm.created_at), 'd MMM yyyy • HH:mm', { locale: dateLocale })}
                    <span className="text-muted-foreground/50">•</span>
                    <span className="capitalize">{comm.direction === 'outbound' ? t('communications:outbound') : t('communications:inbound')}</span>
                  </div>
                </div>

                <Button variant="ghost" size="sm" className="shrink-0">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMessage && (
                <>
                  {(() => {
                    const channel = channelConfig[selectedMessage.channel] || channelConfig.email;
                    const ChannelIcon = channel.icon;
                    return <ChannelIcon className={`h-5 w-5 ${channel.color}`} />;
                  })()}
                  {safeString(selectedMessage.subject) || channelConfig[selectedMessage.channel]?.label || t('communications:message')}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              {/* Status & Date */}
              <div className="flex items-center gap-3 text-sm">
                <span className={`px-2 py-1 rounded-full ${statusConfig[selectedMessage.status]?.className || ''}`}>
                  {statusConfig[selectedMessage.status]?.label || selectedMessage.status}
                </span>
                <span className="text-muted-foreground">
                  {format(parseISO(selectedMessage.created_at), 'd MMMM yyyy HH:mm', { locale: dateLocale })}
                </span>
              </div>

              {/* Tracking info */}
              {(selectedMessage.opened_at || selectedMessage.clicked_at) && (
                <div className="flex gap-4 p-3 bg-muted/50 rounded-lg text-sm">
                  {selectedMessage.opened_at && (
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-success" />
                      <span>{t('communications:openedAt', { date: format(parseISO(selectedMessage.opened_at), 'd MMM HH:mm', { locale: dateLocale }) })}</span>
                    </div>
                  )}
                  {selectedMessage.clicked_at && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>{t('communications:clickedAt', { date: format(parseISO(selectedMessage.clicked_at), 'd MMM HH:mm', { locale: dateLocale }) })}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Message content */}
              <div className="border border-border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                {safeString(selectedMessage.full_message) ? (
                  <div
                    className="prose prose-sm max-w-none text-foreground"
                    dangerouslySetInnerHTML={{ __html: safeString(selectedMessage.full_message) }}
                  />
                ) : (
                  <p className="text-muted-foreground">{safeString(selectedMessage.message_preview) || t('communications:noContentShort')}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
