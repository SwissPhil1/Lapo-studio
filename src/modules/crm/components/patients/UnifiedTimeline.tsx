import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { format, parseISO, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

function groupEventsByDate(events: TimelineEvent[]): { label: string; events: TimelineEvent[] }[] {
  const groups: Record<string, TimelineEvent[]> = {};
  
  events.forEach(event => {
    let label: string;
    const date = event.date;
    
    if (isToday(date)) {
      label = "Aujourd'hui";
    } else if (isYesterday(date)) {
      label = 'Hier';
    } else if (isThisWeek(date)) {
      label = 'Cette semaine';
    } else if (isThisMonth(date)) {
      label = 'Ce mois';
    } else {
      label = format(date, 'MMMM yyyy', { locale: fr });
    }
    
    if (!groups[label]) groups[label] = [];
    groups[label].push(event);
  });
  
  // Sort within each group
  Object.values(groups).forEach(group => {
    group.sort((a, b) => b.date.getTime() - a.date.getTime());
  });
  
  // Return in order: Today, Yesterday, This Week, This Month, then by month
  const orderedLabels = ["Aujourd'hui", 'Hier', 'Cette semaine', 'Ce mois'];
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
}

interface TimelineItemProps {
  event: TimelineEvent;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function TimelineItem({ event, isExpanded, onToggleExpand }: TimelineItemProps) {
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
        case 'completed': return 'Terminé';
        case 'cancelled': return 'Annulé';
        case 'no_show': return 'Absent';
        case 'confirmed': return 'Confirmé';
        default: return status;
      }
    }
    if (type === 'email' || type === 'sms') {
      switch (status) {
        case 'sent': return 'Envoyé';
        case 'delivered': return 'Délivré';
        case 'opened': return 'Ouvert';
        case 'clicked': return 'Cliqué';
        case 'bounced': return 'Rejeté';
        case 'failed': return 'Échec';
        default: return status;
      }
    }
    if (type === 'task') {
      switch (status) {
        case 'pending': return 'En attente';
        case 'in_progress': return 'En cours';
        case 'completed': return 'Terminé';
        case 'cancelled': return 'Annulé';
        default: return status;
      }
    }
    return status;
  };

  const formatTrackingDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "d MMM 'à' HH:mm", { locale: fr });
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
                {/* Delivered indicator */}
                {event?.metadata?.delivered_at && !isBounced && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-green-500">
                          <CheckCheck className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Délivré le {formatTrackingDate(event?.metadata?.delivered_at)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {/* Opened indicator */}
                {event?.metadata?.opened_count > 0 && (
                  <TooltipProvider>
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
                        <p>Ouvert {event?.metadata?.opened_count} fois</p>
                        {event?.metadata?.opened_at && (
                          <p className="text-xs text-muted-foreground">
                            Dernière ouverture: {formatTrackingDate(event?.metadata?.opened_at)}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {/* Clicked indicator */}
                {event?.metadata?.clicked_count > 0 && (
                  <TooltipProvider>
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
                        <p>Cliqué {event?.metadata?.clicked_count} fois</p>
                        {event?.metadata?.clicked_at && (
                          <p className="text-xs text-muted-foreground">
                            Dernier clic: {formatTrackingDate(event?.metadata?.clicked_at)}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {/* Bounced indicator */}
                {isBounced && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-destructive bg-destructive/10 border-destructive/30 text-[10px] px-1.5 py-0">
                          <AlertTriangle className="h-3 w-3 mr-0.5" />
                          Échec
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Email rejeté</p>
                        {event?.metadata?.bounce_reason && (
                          <p className="text-xs text-muted-foreground">{event?.metadata?.bounce_reason}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
            
            {/* Status badge for non-email or when no tracking data */}
            {StatusIcon && event.status && !hasTrackingData && (
              <div className={cn('flex items-center gap-1 text-xs', getStatusColor(event.status))}>
                <StatusIcon className="h-3.5 w-3.5" />
                <span>{getStatusLabel(event.type, event.status)}</span>
              </div>
            )}
            
            {/* Expand chevron for emails with full message */}
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
          {format(event.date, 'd MMM yyyy • HH:mm', { locale: fr })}
        </p>
        
        {/* Metadata display - excluding email tracking (now shown as icons) */}
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
        
        {/* Expanded email content */}
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
      // Check for authenticated session first
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
        throw new Error('Erreur lors du chargement des rendez-vous');
      }
      
      bookings?.forEach(booking => {
        timelineEvents.push({
          id: `booking-${booking.id}`,
          type: 'booking',
          title: booking.service || 'Rendez-vous',
          description: booking.booking_value > 0 ? `Valeur: ${booking.booking_value}€` : undefined,
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
          title: note.title,
          description: note.content,
          date: parseISO(note.created_at),
          metadata: {
            noteType: note.note_type,
          },
        });
      });
      
      // Fetch communications with enhanced tracking data
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
        timelineEvents.push({
          id: `comm-${comm.id}`,
          type,
          title: comm.subject || (type === 'sms' ? 'SMS' : type === 'call' ? 'Appel' : 'Email'),
          description: comm.message_preview || undefined,
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
            bounce_reason: comm.bounce_reason,
            full_message: comm.full_message,
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
      
      tasks?.forEach(task => {
        const taskLabels: Record<string, string> = {
          overdue_recall: 'Rappel en retard',
          dormant: 'Patient inactif',
          no_show_followup: 'Suivi absence',
          manual: 'Tâche manuelle',
        };
        timelineEvents.push({
          id: `task-${task.id}`,
          type: 'task',
          title: taskLabels[task.task_type] || 'Tâche de relance',
          description: task.notes || undefined,
          date: parseISO(task.created_at),
          status: task.status,
        });
      });
      
      // Sort all events by date descending
      timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      return timelineEvents;
    },
    enabled: !!patientId,
  });
  
  // Count events by type
  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(event => {
      counts[event.type] = (counts[event.type] || 0) + 1;
    });
    return counts;
  }, [events]);
  
  // Filter events based on active filters
  const filteredEvents = useMemo(() => {
    if (activeFilters.size === 0) return events;
    return events.filter(event => activeFilters.has(event.type));
  }, [events, activeFilters]);
  
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
          {isSessionExpired ? 'Session expirée' : 'Erreur de chargement'}
        </p>
        <p className="text-muted-foreground text-sm mb-4">
          {isSessionExpired 
            ? 'Veuillez vous reconnecter pour accéder aux données.' 
            : 'Erreur lors du chargement de l\'historique'}
        </p>
        {isSessionExpired && (
          <Button onClick={() => navigate('/auth')} variant="default">
            Se reconnecter
          </Button>
        )}
      </div>
    );
  }
  
  if (events.length === 0) {
    return (
      <div className="card-elevated p-8 text-center">
        <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground">Aucune activité enregistrée</p>
      </div>
    );
  }
  
  const groupedEvents = groupEventsByDate(filteredEvents);
  
  const labels: Record<string, string> = {
    booking: 'Rendez-vous',
    note: 'Notes',
    email: 'Emails',
    sms: 'SMS',
    call: 'Appels',
    task: 'Tâches',
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
                {labels[type]}
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
            <span>Tout afficher</span>
          </button>
        )}
      </div>
      
      {/* Timeline */}
      {filteredEvents.length === 0 ? (
        <div className="card-elevated p-8 text-center">
          <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">Aucune activité pour ce filtre</p>
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
