import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useTranslation } from 'react-i18next';
import { format, parseISO, isToday, isYesterday, isThisWeek, isThisMonth, type Locale } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import {
  Calendar,
  Mail,
  MessageSquare,
  FileText,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Send,
  Eye,
  MousePointerClick,
  CheckCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface TimelineEvent {
  id: string;
  type: 'booking' | 'note' | 'email' | 'sms' | 'call' | 'task';
  title: string;
  description?: string;
  date: Date;
  status?: string;
  metadata?: Record<string, any>;
}

interface UnifiedTimelineProps {
  patientId: string;
}

const eventIcons: Record<string, React.ElementType> = {
  booking: Calendar,
  note: FileText,
  email: Mail,
  sms: MessageSquare,
  call: Phone,
  task: AlertTriangle,
};

const eventColors: Record<string, { bg: string; text: string; border: string }> = {
  booking: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  note: { bg: 'bg-accent', text: 'text-accent-foreground', border: 'border-accent' },
  email: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/30' },
  sms: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/30' },
  call: { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/30' },
  task: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' },
};

// Safety: coerce any non-string value (e.g. JSON object from Supabase) to string
function safeString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return String(value);
}

const statusIcons: Record<string, React.ElementType> = {
  completed: CheckCircle,
  cancelled: XCircle,
  no_show: XCircle,
  pending: Clock,
  confirmed: Clock,
  sent: Send,
  delivered: CheckCircle,
  opened: Eye,
  clicked: MousePointerClick,
  bounced: XCircle,
  failed: XCircle,
};

function useGroupEventsByDate(events: TimelineEvent[], t: (key: string) => string, dateLocale: Locale): { label: string; events: TimelineEvent[] }[] {
  return useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};

    events.forEach(event => {
      let label: string;
      const date = event.date;

      if (isToday(date)) {
        label = t('patientDetail:timeline.today');
      } else if (isYesterday(date)) {
        label = t('patientDetail:timeline.yesterday');
      } else if (isThisWeek(date)) {
        label = t('patientDetail:timeline.thisWeek');
      } else if (isThisMonth(date)) {
        label = t('patientDetail:timeline.thisMonth');
      } else {
        label = format(date, 'MMMM yyyy', { locale: dateLocale });
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(event);
    });

    // Sort within each group
    Object.values(groups).forEach(group => {
      group.sort((a, b) => b.date.getTime() - a.date.getTime());
    });

    // Return in order: Today, Yesterday, This Week, This Month, then by month
    const orderedLabels = [
      t('patientDetail:timeline.today'),
      t('patientDetail:timeline.yesterday'),
      t('patientDetail:timeline.thisWeek'),
      t('patientDetail:timeline.thisMonth'),
    ];
    const result: { label: string; events: TimelineEvent[] }[] = [];

    orderedLabels.forEach(label => {
      if (groups[label]) {
        result.push({ label, events: groups[label] });
        delete groups[label];
      }
    });

    // Add remaining groups sorted by date
    Object.entries(groups)
      .sort((a, b) => {
        const dateA = a[1][0]?.date || new Date(0);
        const dateB = b[1][0]?.date || new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .forEach(([label, events]) => {
        result.push({ label, events });
      });

    return result;
  }, [events, t, dateLocale]);
}

interface TimelineItemProps {
  event: TimelineEvent;
  isExpanded: boolean;
  onToggleExpand: () => void;
  t: (key: string, opts?: Record<string, any>) => string;
  dateLocale: Locale;
}

function TimelineItem({ event, isExpanded, onToggleExpand, t, dateLocale }: TimelineItemProps) {
  const Icon = eventIcons[event.type] || FileText;
  const colors = eventColors[event.type] || eventColors.note;
  const StatusIcon = event.status ? statusIcons[event.status] : null;

  const isEmail = event.type === 'email';
  const hasTrackingData = isEmail && event.metadata;
  const hasFullMessage = isEmail && event.metadata?.full_message;
  const isBounced = event.metadata?.bounced_at;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
      case 'opened':
      case 'clicked':
        return 'text-success';
      case 'cancelled':
      case 'no_show':
      case 'bounced':
      case 'failed':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusLabel = (type: string, status?: string) => {
    if (type === 'booking') {
      switch (status) {
        case 'completed': return t('patientDetail:timeline.bookingCompleted');
        case 'cancelled': return t('patientDetail:timeline.bookingCancelled');
        case 'no_show': return t('patientDetail:timeline.bookingNoShow');
        case 'confirmed': return t('patientDetail:timeline.bookingConfirmed');
        default: return status;
      }
    }
    if (type === 'email' || type === 'sms') {
      switch (status) {
        case 'sent': return t('patientDetail:timeline.emailSent');
        case 'delivered': return t('patientDetail:timeline.emailDelivered');
        case 'opened': return t('patientDetail:timeline.emailOpened');
        case 'clicked': return t('patientDetail:timeline.emailClicked');
        case 'bounced': return t('patientDetail:timeline.emailBounced');
        case 'failed': return t('patientDetail:timeline.emailFailed');
        default: return status;
      }
    }
    if (type === 'task') {
      switch (status) {
        case 'pending': return t('patientDetail:timeline.taskPending');
        case 'in_progress': return t('patientDetail:timeline.taskInProgress');
        case 'completed': return t('patientDetail:timeline.taskCompleted');
        case 'cancelled': return t('patientDetail:timeline.taskCancelled');
        default: return status;
      }
    }
    return status;
  };

  const formatTrackingDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "d MMM 'à' HH:mm", { locale: dateLocale });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex gap-3 group">
      {/* Icon */}
      <div className={cn('flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center', colors.bg)}>
        <Icon className={cn('h-4 w-4', colors.text)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm">{event.title}</p>
            {event.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Email tracking indicators */}
            {hasTrackingData && (
              <div className="flex items-center gap-1.5">
                {event?.metadata?.delivered_at && !isBounced && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-green-500">
                        <CheckCheck className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('patientDetail:timeline.deliveredOn', { date: formatTrackingDate(event?.metadata?.delivered_at) })}</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {event?.metadata?.opened_count > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-0.5 text-blue-500">
                        <Eye className="h-3.5 w-3.5" />
                        {event?.metadata?.opened_count > 1 && (
                          <span className="text-[10px] font-medium">{event?.metadata?.opened_count}</span>
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('patientDetail:timeline.openedTimes', { count: event?.metadata?.opened_count })}</p>
                      {event?.metadata?.opened_at && (
                        <p className="text-xs text-muted-foreground">
                          {t('patientDetail:timeline.lastOpened', { date: formatTrackingDate(event?.metadata?.opened_at) })}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                )}

                {event?.metadata?.clicked_count > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-0.5 text-purple-500">
                        <MousePointerClick className="h-3.5 w-3.5" />
                        {event?.metadata?.clicked_count > 1 && (
                          <span className="text-[10px] font-medium">{event?.metadata?.clicked_count}</span>
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('patientDetail:timeline.clickedTimes', { count: event?.metadata?.clicked_count })}</p>
                      {event?.metadata?.clicked_at && (
                        <p className="text-xs text-muted-foreground">
                          {t('patientDetail:timeline.lastClick', { date: formatTrackingDate(event?.metadata?.clicked_at) })}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                )}

                {isBounced && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-destructive bg-destructive/10 border-destructive/30 text-[10px] px-1.5 py-0">
                        <AlertTriangle className="h-3 w-3 mr-0.5" />
                        {t('patientDetail:timeline.bounced')}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('patientDetail:timeline.emailRejected')}</p>
                      {event?.metadata?.bounce_reason && (
                        <p className="text-xs text-muted-foreground">{event?.metadata?.bounce_reason}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}

            {StatusIcon && event.status && !hasTrackingData && (
              <div className={cn('flex items-center gap-1 text-xs', getStatusColor(event.status))}>
                <StatusIcon className="h-3.5 w-3.5" />
                <span>{getStatusLabel(event.type, event.status)}</span>
              </div>
            )}

            {hasFullMessage && (
              <div
                role="button"
                tabIndex={0}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleExpand();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleExpand();
                  }
                }}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-1">
          {format(event.date, 'd MMM yyyy • HH:mm', { locale: dateLocale })}
        </p>

        {event.metadata && !isEmail && (
          <div className="mt-2 flex flex-wrap gap-2">
            {event?.metadata?.service && (
              <span className="text-xs px-2 py-0.5 bg-muted rounded-full">{event?.metadata?.service}</span>
            )}
            {event?.metadata?.value && (
              <span className="text-xs px-2 py-0.5 bg-success/10 text-success rounded-full">
                {event?.metadata?.value}€
              </span>
            )}
            {event?.metadata?.channel && (
              <span className="text-xs px-2 py-0.5 bg-muted rounded-full capitalize">{event?.metadata?.channel}</span>
            )}
          </div>
        )}

        {isExpanded && hasFullMessage && (
          <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border/50">
            <div
              className="text-sm prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: event?.metadata?.full_message }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function UnifiedTimeline({ patientId }: UnifiedTimelineProps) {
  const { t, i18n } = useTranslation(['patientDetail']);
  const dateLocale = i18n.language === 'fr' ? frLocale : enUS;
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const toggleEventExpanded = (id: string) => {
    setExpandedEvents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['patient-timeline', patientId],
    queryFn: async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('SESSION_EXPIRED');
      }

      const timelineEvents: TimelineEvent[] = [];

      // Fetch bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, booking_date, service, status, booking_value')
        .eq('patient_id', patientId)
        .order('booking_date', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        throw new Error('LOAD_BOOKINGS_ERROR');
      }

      bookings?.forEach(booking => {
        timelineEvents.push({
          id: `booking-${booking.id}`,
          type: 'booking',
          title: safeString(booking.service) || t('patientDetail:timeline.appointment'),
          description: booking.booking_value > 0 ? t('patientDetail:timeline.value', { amount: booking.booking_value }) : undefined,
          date: parseISO(booking.booking_date),
          status: booking.status || 'confirmed',
          metadata: {
            service: booking.service,
            value: booking.booking_value,
          },
        });
      });

      // Fetch CRM notes
      const { data: notes, error: notesError } = await supabase
        .from('crm_notes')
        .select('id, title, content, note_type, created_at')
        .eq('user_id', patientId)
        .order('created_at', { ascending: false });

      if (notesError) {
        console.error('Error fetching notes:', notesError);
      }

      notes?.forEach(note => {
        timelineEvents.push({
          id: `note-${note.id}`,
          type: 'note',
          title: safeString(note.title),
          description: safeString(note.content) || undefined,
          date: parseISO(note.created_at),
          metadata: {
            noteType: note.note_type,
          },
        });
      });

      // Fetch communications
      const { data: communications, error: commsError } = await supabase
        .from('crm_communication_logs')
        .select('id, channel, subject, message_preview, full_message, status, sent_at, opened_count, clicked_count, delivered_at, opened_at, clicked_at, bounced_at, bounce_reason')
        .eq('patient_id', patientId)
        .order('sent_at', { ascending: false });

      if (commsError) {
        console.error('Error fetching communications:', commsError);
      }

      communications?.forEach(comm => {
        const type = comm.channel === 'sms' ? 'sms' : comm.channel === 'call' ? 'call' : 'email';
        const subject = safeString(comm.subject);
        timelineEvents.push({
          id: `comm-${comm.id}`,
          type,
          title: subject || (type === 'sms' ? t('patientDetail:timeline.sms') : type === 'call' ? t('patientDetail:timeline.call') : 'Email'),
          description: safeString(comm.message_preview) || undefined,
          date: parseISO(comm.sent_at),
          status: comm.status,
          metadata: {
            channel: comm.channel,
            opened_count: comm.opened_count || 0,
            clicked_count: comm.clicked_count || 0,
            delivered_at: comm.delivered_at,
            opened_at: comm.opened_at,
            clicked_at: comm.clicked_at,
            bounced_at: comm.bounced_at,
            bounce_reason: safeString(comm.bounce_reason),
            full_message: safeString(comm.full_message),
          },
        });
      });

      // Fetch reactivation tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('reactivation_tasks')
        .select('id, task_type, status, notes, created_at')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
      }

      const taskLabelKeys: Record<string, string> = {
        overdue_recall: 'overdueRecall',
        dormant: 'dormantPatient',
        no_show_followup: 'noShowFollowup',
        manual: 'manualTask',
      };

      tasks?.forEach(task => {
        timelineEvents.push({
          id: `task-${task.id}`,
          type: 'task',
          title: taskLabelKeys[task.task_type]
            ? t(`patientDetail:timeline.${taskLabelKeys[task.task_type]}`)
            : t('patientDetail:timeline.reactivationTask'),
          description: safeString(task.notes) || undefined,
          date: parseISO(task.created_at),
          status: task.status,
        });
      });

      timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime());

      return timelineEvents;
    },
    enabled: !!patientId,
  });

  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(event => {
      counts[event.type] = (counts[event.type] || 0) + 1;
    });
    return counts;
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (activeFilters.size === 0) return events;
    return events.filter(event => activeFilters.has(event.type));
  }, [events, activeFilters]);

  const groupedEvents = useGroupEventsByDate(filteredEvents, t, dateLocale);

  const toggleFilter = (type: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const clearFilters = () => setActiveFilters(new Set());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    const isSessionExpired = error.message === 'SESSION_EXPIRED';

    return (
      <div className="card-elevated p-6 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-warning" />
        <p className="text-foreground font-medium mb-2">
          {isSessionExpired ? t('patientDetail:timeline.sessionExpired') : t('patientDetail:timeline.loadingError')}
        </p>
        <p className="text-muted-foreground text-sm mb-4">
          {isSessionExpired
            ? t('patientDetail:timeline.reconnectMessage')
            : t('patientDetail:timeline.historyError')}
        </p>
        {isSessionExpired && (
          <Button onClick={() => navigate('/auth')} variant="default">
            {t('patientDetail:timeline.reconnect')}
          </Button>
        )}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="card-elevated p-8 text-center">
        <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground">{t('patientDetail:timeline.noActivity')}</p>
      </div>
    );
  }

  const labelKeys: Record<string, string> = {
    booking: 'bookingLabel',
    note: 'noteLabel',
    email: 'emailLabel',
    sms: 'smsLabel',
    call: 'callLabel',
    task: 'taskLabel',
  };

  return (
    <div className="space-y-6">
      {/* Clickable Legend Filters */}
      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(eventColors).map(([type, colors]) => {
          const Icon = eventIcons[type];
          const count = eventCounts[type] || 0;
          const isActive = activeFilters.has(type);
          const hasActiveFilters = activeFilters.size > 0;

          return (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all duration-200 cursor-pointer',
                isActive
                  ? cn(colors.bg, colors.border, 'border-2')
                  : hasActiveFilters
                    ? 'bg-muted/30 border-transparent opacity-50 hover:opacity-80'
                    : cn('bg-muted/50 border-transparent hover:border-border', colors.bg.replace('/10', '/20'))
              )}
            >
              <div className={cn('h-4 w-4 rounded-full flex items-center justify-center', colors.bg)}>
                <Icon className={cn('h-2.5 w-2.5', colors.text)} />
              </div>
              <span className={cn(
                'font-medium',
                isActive ? colors.text : 'text-muted-foreground'
              )}>
                {t(`patientDetail:timeline.${labelKeys[type]}`)}
              </span>
              {count > 0 && (
                <span className={cn(
                  'ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                  isActive ? cn(colors.bg, colors.text) : 'bg-muted text-muted-foreground'
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {activeFilters.size > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>{t('patientDetail:timeline.showAll')}</span>
          </button>
        )}
      </div>

      {/* Timeline */}
      {filteredEvents.length === 0 ? (
        <div className="card-elevated p-8 text-center">
          <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">{t('patientDetail:timeline.noActivityForFilter')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedEvents.map(group => (
            <div key={group.label}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 sticky top-0 bg-background py-1">
                {group.label}
              </h4>
              <div className="border-l-2 border-border pl-4 space-y-1">
                {group.events.map(event => (
                  <TimelineItem
                    key={event.id}
                    event={event}
                    isExpanded={!!expandedEvents[event.id]}
                    onToggleExpand={() => toggleEventExpanded(event.id)}
                    t={t}
                    dateLocale={dateLocale}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
