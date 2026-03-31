import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO, type Locale } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import DOMPurify from 'dompurify';
import { Mail, MessageSquare, Phone } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCommunicationThread, type ThreadMessage } from '@/shared/hooks/useCommunicationThread';

const CHANNEL_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  phone: Phone,
  whatsapp: MessageSquare,
};

export function ConversationThreadView({
  patientId,
  patientName,
}: {
  patientId: string;
  patientName?: string;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'fr' ? frLocale : enUS;
  const { data: messages = [], isLoading } = useCommunicationThread(patientId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        {t('communications.noMessages', { defaultValue: 'No messages yet' })}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {patientName && (
        <div className="border-b border-border px-4 py-2">
          <p className="text-sm font-medium">{patientName}</p>
          <p className="text-xs text-muted-foreground">
            {messages.length} {t('communications.messages', { defaultValue: 'messages' })}
          </p>
        </div>
      )}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} locale={locale} t={t} />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}

function MessageBubble({
  message,
  locale,
  t,
}: {
  message: ThreadMessage;
  locale: Locale;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const isInbound = message.direction === 'inbound';
  const Icon = CHANNEL_ICONS[message.channel] || Mail;
  const time = message.sent_at
    ? format(parseISO(message.sent_at), 'dd MMM, HH:mm', { locale })
    : '';

  const content = message.message_preview || message.subject || '';

  return (
    <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
          isInbound
            ? 'bg-muted text-foreground rounded-bl-sm'
            : 'bg-primary text-primary-foreground rounded-br-sm'
        }`}
      >
        <div className={`flex items-center gap-1.5 mb-1 text-xs ${isInbound ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
          <Icon className="h-3 w-3" />
          <span>{isInbound ? t('communications.received', { defaultValue: 'Received' }) : t('communications.sent', { defaultValue: 'Sent' })}</span>
          {message.subject && <span className="font-medium">· {message.subject}</span>}
        </div>
        {message.full_message ? (
          <div
            className="text-sm prose prose-sm max-w-none [&_*]:!text-inherit"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.full_message) }}
          />
        ) : (
          <p className="text-sm">{content}</p>
        )}
        <p className={`text-xs mt-1 ${isInbound ? 'text-muted-foreground' : 'text-primary-foreground/60'}`}>
          {time}
        </p>
      </div>
    </div>
  );
}
