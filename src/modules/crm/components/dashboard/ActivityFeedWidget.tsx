import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Calendar, 
  StickyNote, 
  ArrowRightLeft, 
  ListTodo, 
  CheckCircle,
  Loader2,
  Activity,
  UserPlus,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Phone,
  XCircle,
  Eye,
  MousePointerClick,
  CheckCheck
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/components/ui/button';

interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  patient?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface GroupedActivity extends ActivityItem {
  children: ActivityItem[];
}

const activityConfig: Record<string, { 
  icon: typeof Mail; 
  bgClass: string; 
  textClass: string;
  label: string;
}> = {
  email_sent: { 
    icon: Mail, 
    bgClass: 'bg-primary/10', 
    textClass: 'text-primary',
    label: 'Email'
  },
  email_received: { 
    icon: Mail, 
    bgClass: 'bg-accent', 
    textClass: 'text-accent-foreground',
    label: 'Email'
  },
  booking_status_changed: { 
    icon: Calendar, 
    bgClass: 'bg-warning/10', 
    textClass: 'text-warning-foreground',
    label: 'RDV'
  },
  pipeline_added: { 
    icon: UserPlus, 
    bgClass: 'bg-success/10', 
    textClass: 'text-success',
    label: 'Pipeline'
  },
  pipeline_stage_changed: { 
    icon: ArrowRightLeft, 
    bgClass: 'bg-purple-100', 
    textClass: 'text-purple-600',
    label: 'Pipeline'
  },
  task_created: { 
    icon: ListTodo, 
    bgClass: 'bg-blue-100', 
    textClass: 'text-blue-600',
    label: 'Tâche'
  },
  task_status_changed: { 
    icon: CheckCircle, 
    bgClass: 'bg-success/10', 
    textClass: 'text-success',
    label: 'Tâche'
  },
  note_added: { 
    icon: StickyNote, 
    bgClass: 'bg-amber-100', 
    textClass: 'text-amber-600',
    label: 'Note'
  },
  note_created: { 
    icon: StickyNote, 
    bgClass: 'bg-amber-100', 
    textClass: 'text-amber-600',
    label: 'Note'
  },
  communication_sent: { 
    icon: Mail, 
    bgClass: 'bg-primary/10', 
    textClass: 'text-primary',
    label: 'Communication'
  },
  communication_received: { 
    icon: Mail, 
    bgClass: 'bg-accent', 
    textClass: 'text-accent-foreground',
    label: 'Communication'
  },
  email_opened: { 
    icon: Eye, 
    bgClass: 'bg-blue-500/10', 
    textClass: 'text-blue-600',
    label: 'Email ouvert'
  },
  email_clicked: { 
    icon: MousePointerClick, 
    bgClass: 'bg-purple-500/10', 
    textClass: 'text-purple-600',
    label: 'Lien cliqué'
  },
};

const defaultConfig = {
  icon: Activity,
  bgClass: 'bg-muted',
  textClass: 'text-muted-foreground',
  label: 'Activité'
};

// Map activity types to filter categories - matching UnifiedTimeline's granular types
const getActivityCategory = (activity: ActivityItem): string => {
  const activityType = activity.activity_type;
  
  // Handle communication activities based on channel
  if (activityType === 'communication_sent' || activityType === 'communication_received') {
    const channel = (activity.metadata as Record<string, unknown>)?.channel;
    if (channel === 'sms') return 'sms';
    if (channel === 'phone' || channel === 'call') return 'call';
    return 'email';
  }
  
  // Direct mappings matching UnifiedTimeline types
  switch (activityType) {
    case 'email_sent':
    case 'email_received':
    case 'email_opened':
    case 'email_clicked':
      return 'email';
    case 'booking_status_changed':
      return 'booking';
    case 'pipeline_added':
    case 'pipeline_stage_changed':
      return 'booking'; // Group pipeline with RDV for now
    case 'task_created':
    case 'task_status_changed':
      return 'task';
    case 'note_added':
    case 'note_created':
      return 'note';
    default:
      return 'note';
  }
};

// Labels matching UnifiedTimeline exactly
const categoryLabels: Record<string, string> = {
  booking: 'Rendez-vous',
  note: 'Notes',
  email: 'Emails',
  sms: 'SMS',
  call: 'Appels',
  task: 'Tâches',
};

// Colors matching UnifiedTimeline exactly
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  booking: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  note: { bg: 'bg-accent', text: 'text-accent-foreground', border: 'border-accent' },
  email: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/30' },
  sms: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/30' },
  call: { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/30' },
  task: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' },
};

// Icons matching UnifiedTimeline exactly
const categoryIcons: Record<string, typeof Mail> = {
  booking: Calendar,
  note: StickyNote,
  email: Mail,
  sms: MessageSquare,
  call: Phone,
  task: ListTodo,
};

interface ActivityFeedWidgetProps {
  limit?: number;
  patientId?: string;
  showHeader?: boolean;
  className?: string;
  collapsedLimit?: number;
}

export function ActivityFeedWidget({ 
  limit = 20, 
  patientId,
  showHeader = true,
  className,
  collapsedLimit = 3 
}: ActivityFeedWidgetProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const { data: activities = [], isLoading, error } = useQuery({
    queryKey: ['activity-feed', patientId, limit],
    queryFn: async () => {
      let query = supabase
        .from('crm_activities')
        .select(`
          id,
          user_id,
          activity_type,
          title,
          description,
          metadata,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (patientId) {
        query = query.eq('user_id', patientId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch patient names for the activities
      if (data && data.length > 0) {
        const patientIds = [...new Set(data.map(a => a.user_id))];
        const { data: patients } = await supabase
          .from('patients')
          .select('id, first_name, last_name')
          .in('id', patientIds);
        
        const patientMap = new Map(patients?.map(p => [p.id, p]));
        
        return data.map(activity => ({
          ...activity,
          patient: patientMap.get(activity.user_id) || null
        })) as ActivityItem[];
      }
      
      return data as ActivityItem[];
    },
    refetchInterval: 30000,
  });

  // Group email activities by communication_id
  const groupedActivities = useMemo(() => {
    const emailGroups = new Map<string, ActivityItem[]>();
    const nonEmailActivities: ActivityItem[] = [];
    
    activities.forEach(activity => {
      const metadata = activity.metadata as Record<string, unknown> | null;
      const commId = metadata?.communication_id as string | undefined;
      const isEmailActivity = ['communication_sent', 'email_sent', 'email_opened', 'email_clicked'].includes(activity.activity_type);
      
      if (isEmailActivity && commId) {
        if (!emailGroups.has(commId)) {
          emailGroups.set(commId, []);
        }
        emailGroups.get(commId)!.push(activity);
      } else {
        nonEmailActivities.push(activity);
      }
    });
    
    // Convert to list with parent/children
    const result: GroupedActivity[] = [];
    emailGroups.forEach((group) => {
      // Sort by date (sent first)
      group.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const parent = group.find(a => a.activity_type === 'communication_sent' || a.activity_type === 'email_sent');
      const children = group.filter(a => a !== parent);
      
      if (parent) {
        result.push({ ...parent, children });
      } else if (group.length > 0) {
        // If no parent found, use the first event as parent
        result.push({ ...group[0], children: group.slice(1) });
      }
    });
    
    // Merge with non-email activities and sort by date
    return [...result, ...nonEmailActivities.map(a => ({ ...a, children: [] }))]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [activities]);

  // Calculate category counts (from original activities for accurate count)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    // Count only parent activities to avoid duplicates
    groupedActivities.forEach(activity => {
      const category = getActivityCategory(activity);
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  }, [groupedActivities]);

  // Count unique emails with engagement for header badges
  const emailEngagementCounts = useMemo(() => {
    let opened = 0;
    let clicked = 0;
    groupedActivities.forEach(activity => {
      const hasOpened = activity.children.some(c => c.activity_type === 'email_opened');
      const hasClicked = activity.children.some(c => c.activity_type === 'email_clicked');
      if (hasOpened) opened++;
      if (hasClicked) clicked++;
    });
    return { opened, clicked };
  }, [groupedActivities]);

  // Filter activities based on active filters
  const filteredActivities = useMemo(() => {
    if (activeFilters.length === 0) return groupedActivities;
    return groupedActivities.filter(activity => {
      const category = getActivityCategory(activity);
      return activeFilters.includes(category);
    });
  }, [groupedActivities, activeFilters]);

  // Apply display limit based on expanded state
  const displayedActivities = expanded 
    ? filteredActivities 
    : filteredActivities.slice(0, collapsedLimit);

  const toggleFilter = (category: string) => {
    setActiveFilters(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleItemExpanded = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleActivityClick = (activity: ActivityItem) => {
    if (activity.user_id) {
      navigate(`/crm/patients/${activity.user_id}`);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("card-elevated", className)}>
        {showHeader && (
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Activité récente
            </h3>
          </div>
        )}
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("card-elevated p-4", className)}>
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Erreur de chargement</span>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={cn("card-elevated", className)}>
        {showHeader && (
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Activité récente
            </h3>
          </div>
        )}
        <div className="p-6 text-center text-muted-foreground text-sm">
          Aucune activité récente
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card-elevated", className)}>
      {showHeader && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Activité récente
            </h3>
            {/* Email engagement badges */}
            {(emailEngagementCounts.opened > 0 || emailEngagementCounts.clicked > 0) && (
              <div className="flex items-center gap-2">
                {emailEngagementCounts.opened > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-600 text-xs font-medium">
                    <Eye className="h-3 w-3" />
                    <span>{emailEngagementCounts.opened}</span>
                  </div>
                )}
                {emailEngagementCounts.clicked > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium">
                    <MousePointerClick className="h-3 w-3" />
                    <span>{emailEngagementCounts.clicked}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Filter Legend - matching UnifiedTimeline exactly */}
      <div className="px-4 pt-3 flex flex-wrap gap-2 text-xs">
        {Object.entries(categoryColors).map(([type, colors]) => {
          const Icon = categoryIcons[type];
          const count = categoryCounts[type] || 0;
          const isActive = activeFilters.includes(type);
          const hasActiveFilters = activeFilters.length > 0;
          
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
                {categoryLabels[type]}
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
        
        {activeFilters.length > 0 && (
          <button
            onClick={() => setActiveFilters([])}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>Tout afficher</span>
          </button>
        )}
      </div>

      {/* Activities List */}
      <div>
        {displayedActivities.map((activity, index) => {
          let config = activityConfig[activity.activity_type] || defaultConfig;
          
          // For communication activities, use channel-specific icon
          if (activity.activity_type === 'communication_sent' || activity.activity_type === 'communication_received') {
            const channel = (activity.metadata as Record<string, unknown>)?.channel;
            if (channel === 'sms') {
              config = { ...config, icon: MessageSquare, label: 'SMS' };
            } else if (channel === 'phone') {
              config = { ...config, icon: Phone, label: 'Appel' };
            } else {
              config = { ...config, icon: Mail, label: 'Email' };
            }
          }
          
          const Icon = config.icon;
          const patientName = activity.patient 
            ? `${activity.patient.first_name} ${activity.patient.last_name}`
            : 'Patient inconnu';

          // Extract email tracking from metadata
          const metadata = activity.metadata as Record<string, unknown> | null;
          const isEmailSent = activity.activity_type === 'email_sent' || activity.activity_type === 'communication_sent';
          const isDelivered = !!metadata?.delivered_at;
          
          // Check if this activity has children (email engagement events)
          const hasChildren = activity.children && activity.children.length > 0;
          const isItemExpanded = !!expandedItems[activity.id];
          const hasOpened = activity.children?.some(c => c.activity_type === 'email_opened');
          const hasClicked = activity.children?.some(c => c.activity_type === 'email_clicked');

          // Format timestamp like Communications page
          const activityDate = parseISO(activity.created_at);
          const isToday = new Date().toDateString() === activityDate.toDateString();
          const timeStr = format(activityDate, 'HH:mm', { locale: fr });
          const dateStr = isToday ? 'Auj.' : format(activityDate, 'd MMM', { locale: fr });

          // Get a short summary for second line
          const getShortSummary = () => {
            const category = getActivityCategory(activity);
            return categoryLabels[category] || config.label;
          };

          return (
            <div
              key={activity.id}
              className="border-b border-border/50 last:border-b-0 animate-fade-in"
              style={{ animationDelay: `${Math.min(index * 20, 200)}ms` }}
            >
              {/* Main activity row */}
              <div
                onClick={() => handleActivityClick(activity)}
                className="group flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 cursor-pointer transition-colors"
              >
                {/* Icon - compact square */}
                <div className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  config.bgClass
                )}>
                  <Icon className={cn('h-4 w-4', config.textClass)} />
                </div>
                
                {/* Main content */}
                <div className="flex-1 min-w-0">
                  {/* Line 1: Patient name + title/subject */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground truncate max-w-[180px]">
                      {patientName}
                    </span>
                    <span className="text-sm text-muted-foreground truncate hidden sm:inline flex-1">
                      {activity.title}
                    </span>
                  </div>
                  
                  {/* Line 2: Category + inline tracking indicators */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn('text-[11px] font-medium', config.textClass)}>
                      {getShortSummary()}
                    </span>
                    {/* Inline indicators for grouped email events */}
                    {hasChildren && (
                      <div className="flex items-center gap-1">
                        {hasOpened && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-blue-500">
                                  <Eye className="h-3 w-3" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Email ouvert</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {hasClicked && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-purple-500">
                                  <MousePointerClick className="h-3 w-3" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Lien cliqué</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Right side: Tracking + Time + Chevron */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Email tracking indicators - inline like Communications */}
                  {isEmailSent && (
                    <div className="hidden sm:flex items-center gap-1">
                      {isDelivered && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-green-500">
                                <CheckCheck className="h-3.5 w-3.5" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Délivré</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  )}
                  
                  {/* Timestamp - compact like Communications */}
                  <div className="text-right text-xs text-muted-foreground min-w-[45px]">
                    <div className="font-medium">{timeStr}</div>
                    <div className="text-[10px]">{dateStr}</div>
                  </div>
                  
                  {/* Expand chevron for items with children */}
                  {hasChildren && (
                    <div
                      role="button"
                      tabIndex={0}
                      className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleItemExpanded(activity.id);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleItemExpanded(activity.id);
                        }
                      }}
                    >
                      {isItemExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Expanded children (email engagement events) */}
              {isItemExpanded && hasChildren && (
                <div className="ml-11 pl-4 border-l-2 border-muted">
                  {activity.children.map((child) => {
                    const childDate = parseISO(child.created_at);
                    const childTimeStr = format(childDate, 'HH:mm', { locale: fr });
                    const isChildToday = new Date().toDateString() === childDate.toDateString();
                    const childDateStr = isChildToday ? 'Auj.' : format(childDate, 'd MMM', { locale: fr });
                    
                    const childConfig = activityConfig[child.activity_type] || defaultConfig;
                    const ChildIcon = childConfig.icon;
                    
                    return (
                      <div
                        key={child.id}
                        className="flex items-center gap-3 py-2 px-2 hover:bg-muted/20 rounded-md transition-colors"
                      >
                        <div className={cn(
                          'h-6 w-6 rounded-md flex items-center justify-center',
                          childConfig.bgClass
                        )}>
                          <ChildIcon className={cn('h-3 w-3', childConfig.textClass)} />
                        </div>
                        <span className={cn('text-sm font-medium', childConfig.textClass)}>
                          {childConfig.label}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {childTimeStr} · {childDateStr}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expand/Collapse Toggle */}
      {filteredActivities.length > collapsedLimit && (
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Voir moins
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Voir plus ({filteredActivities.length - collapsedLimit})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
