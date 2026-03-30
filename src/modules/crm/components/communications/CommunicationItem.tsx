import { useState } from 'react';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  MessageSquare,
  Phone,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  Eye,
  MousePointerClick,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';
import { type CommunicationLog, statusColors } from '@/shared/types/communications';

interface CommunicationItemProps {
  communication: CommunicationLog;
  index: number;
}

const channelIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  sms: <MessageSquare className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
};

const channelColors: Record<string, string> = {
  email: 'bg-info/15 text-info',
  sms: 'bg-success/15 text-success',
  phone: 'bg-primary/15 text-primary',
};

// Safety: coerce any non-string value (e.g. JSON object from Supabase) to string
function safeString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return String(value);
}

export function CommunicationItem({ communication, index }: CommunicationItemProps) {
  const { t, i18n } = useTranslation(['communications']);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const dateLocale = i18n.language === 'fr' ? frLocale : enUS;
  const isOutbound = communication.direction !== 'inbound';
  const isEmail = communication.channel === 'email';

  const patientName = communication.patients
    ? `${communication.patients.first_name} ${communication.patients.last_name}`
    : t('communications:unknownPatient');

  // Determine email tracking indicators
  const hasTracking = isEmail && communication.resend_email_id;
  const isDelivered = !!communication.delivered_at;
  const isOpened = (communication.opened_count || 0) > 0;
  const isClicked = (communication.clicked_count || 0) > 0;
  const isBounced = !!communication.bounced_at;

  const sentDate = new Date(communication.sent_at);
  const isToday = new Date().toDateString() === sentDate.toDateString();
  const timeStr = format(sentDate, 'HH:mm', { locale: dateLocale });
  const dateStr = isToday ? t('communications:todayAbbrev') : format(sentDate, 'd MMM', { locale: dateLocale });

  const channelLabelMap: Record<string, string> = {
    email: t('communications:channelEmail'),
    sms: t('communications:channelSms'),
    whatsapp: t('communications:channelWhatsapp'),
    phone: t('communications:channelPhone'),
  };

  const statusLabelMap: Record<string, string> = {
    sent: t('communications:statusSent'),
    delivered: t('communications:statusDelivered'),
    read: t('communications:statusRead'),
    failed: t('communications:statusFailed'),
    pending: t('communications:statusPending'),
  };

  // Safe coerce fields that may be objects from Supabase
  const subject = safeString(communication.subject);
  const messagePreview = safeString(communication.message_preview);
  const fullMessage = safeString(communication.full_message);
  const bounceReason = safeString(communication.bounce_reason);

  return (
    <div
      className="group border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors animate-fade-in"
      style={{ animationDelay: `${Math.min(index * 20, 200)}ms` }}
    >
      {/* Main row - compact */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Channel icon - compact */}
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
          channelColors[communication.channel] || 'bg-muted text-muted-foreground'
        )}>
          {channelIcons[communication.channel] || <Mail className="h-4 w-4" />}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Line 1: Patient + Subject */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/crm/patients/${communication.patient_id}`)}
              className="font-semibold text-foreground hover:text-primary hover:underline transition-colors truncate max-w-[180px]"
            >
              {patientName}
            </button>
            <span className="text-sm text-muted-foreground truncate hidden sm:inline flex-1">
              {subject || t('communications:noSubject')}
            </span>
          </div>

          {/* Line 2: Direction + Channel + Status */}
          <div className="flex items-center gap-1.5 mt-0.5">
            {/* Direction */}
            <span className={cn(
              "inline-flex items-center gap-0.5 text-[11px]",
              isOutbound ? "text-info" : "text-success"
            )}>
              {isOutbound ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
              {isOutbound ? t('communications:sent') : t('communications:received')}
            </span>

            <span className="text-muted-foreground/50 text-[10px]">•</span>

            {/* Channel label */}
            <span className="text-[11px] text-muted-foreground">
              {channelLabelMap[communication.channel] || communication.channel}
            </span>

            <span className="text-muted-foreground/50 text-[10px]">•</span>

            {/* Status badge - compact */}
            {isBounced ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 font-normal bg-destructive/10 text-destructive border-destructive/20 cursor-help"
                  >
                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                    {t('communications:bounced')}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{bounceReason || t('communications:bouncedDefault')}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4 font-normal border-transparent",
                  statusColors[communication.status] || 'bg-muted text-muted-foreground'
                )}
              >
                {statusLabelMap[communication.status] || communication.status}
              </Badge>
            )}
          </div>
        </div>

        {/* Right side: Tracking + Time */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Tracking indicators - inline */}
          {hasTracking && !isBounced && (
            <div className="hidden sm:flex items-center gap-1">
              {isDelivered && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-success">
                      <CheckCheck className="h-3.5 w-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('communications:deliveredAt', { date: format(new Date(communication.delivered_at!), 'dd/MM HH:mm', { locale: dateLocale }) })}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {isOpened && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-0.5 text-info">
                      <Eye className="h-3.5 w-3.5" />
                      {(communication.opened_count || 0) > 1 && (
                        <span className="text-[10px]">{communication.opened_count}</span>
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('communications:openedTimes', { count: communication.opened_count })}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {isClicked && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-0.5 text-primary">
                      <MousePointerClick className="h-3.5 w-3.5" />
                      {(communication.clicked_count || 0) > 1 && (
                        <span className="text-[10px]">{communication.clicked_count}</span>
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('communications:clickCount', { count: communication.clicked_count })}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className="text-right text-xs text-muted-foreground min-w-[45px]">
            <div className="font-medium">{timeStr}</div>
            <div className="text-[10px]">{dateStr}</div>
          </div>

          {/* Expand button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-3 pt-2 ml-11 border-t border-border/30 bg-muted/20 animate-fade-in">
          {/* Subject on mobile */}
          <div className="sm:hidden mb-2">
            <span className="text-xs text-muted-foreground font-medium">{t('communications:subjectLabel')}</span>
            <span className="text-sm">{subject || t('communications:noSubject')}</span>
          </div>

          {/* Message content */}
          {fullMessage ? (
            <div
              className="text-sm text-muted-foreground prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: fullMessage }}
            />
          ) : messagePreview ? (
            <p className="text-sm text-muted-foreground">
              {messagePreview}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {t('communications:noContent')}
            </p>
          )}

          {/* Tracking details for mobile */}
          {hasTracking && !isBounced && (
            <div className="sm:hidden flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
              {isDelivered && (
                <Badge variant="outline" className="text-[10px] text-success border-success/20 bg-success/10">
                  <CheckCheck className="h-3 w-3 mr-1" />
                  {t('communications:deliveredBadge')}
                </Badge>
              )}
              {isOpened && (
                <Badge variant="outline" className="text-[10px] text-info border-info/20 bg-info/10">
                  <Eye className="h-3 w-3 mr-1" />
                  {t('communications:openedBadge', { count: communication.opened_count })}
                </Badge>
              )}
              {isClicked && (
                <Badge variant="outline" className="text-[10px] text-primary border-primary/20 bg-primary/10">
                  <MousePointerClick className="h-3 w-3 mr-1" />
                  {t('communications:clickedBadge', { count: communication.clicked_count })}
                </Badge>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
