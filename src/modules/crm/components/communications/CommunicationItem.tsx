import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';
import { CommunicationLog, channelLabels, statusColors, statusLabels } from '@/shared/types/communications';

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
  email: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  sms: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  phone: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
};

export function CommunicationItem({ communication, index }: CommunicationItemProps) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const isOutbound = communication.direction !== 'inbound';
  const isEmail = communication.channel === 'email';
  
  const patientName = communication.patients 
    ? `${communication.patients.first_name} ${communication.patients.last_name}`
    : 'Patient inconnu';

  // Determine email tracking indicators
  const hasTracking = isEmail && communication.resend_email_id;
  const isDelivered = !!communication.delivered_at;
  const isOpened = (communication.opened_count || 0) > 0;
  const isClicked = (communication.clicked_count || 0) > 0;
  const isBounced = !!communication.bounced_at;

  const sentDate = new Date(communication.sent_at);
  const isToday = new Date().toDateString() === sentDate.toDateString();
  const timeStr = format(sentDate, 'HH:mm', { locale: fr });
  const dateStr = isToday ? "Auj." : format(sentDate, 'd MMM', { locale: fr });

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
              {communication.subject || 'Sans objet'}
            </span>
          </div>
          
          {/* Line 2: Direction + Channel + Status */}
          <div className="flex items-center gap-1.5 mt-0.5">
            {/* Direction */}
            <span className={cn(
              "inline-flex items-center gap-0.5 text-[11px]",
              isOutbound ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"
            )}>
              {isOutbound ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
              {isOutbound ? 'Envoyé' : 'Reçu'}
            </span>
            
            <span className="text-muted-foreground/50 text-[10px]">•</span>
            
            {/* Channel label */}
            <span className="text-[11px] text-muted-foreground">
              {channelLabels[communication.channel] || communication.channel}
            </span>
            
            <span className="text-muted-foreground/50 text-[10px]">•</span>
            
            {/* Status badge - compact */}
            {isBounced ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline" 
                      className="text-[10px] px-1.5 py-0 h-4 font-normal bg-destructive/10 text-destructive border-destructive/20 cursor-help"
                    >
                      <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                      Échec
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{communication.bounce_reason || 'Email non délivré'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4 font-normal border-transparent",
                  statusColors[communication.status] || 'bg-muted text-muted-foreground'
                )}
              >
                {statusLabels[communication.status] || communication.status}
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-green-500">
                        <CheckCheck className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Délivré le {format(new Date(communication.delivered_at!), 'dd/MM à HH:mm', { locale: fr })}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {isOpened && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-0.5 text-blue-500">
                        <Eye className="h-3.5 w-3.5" />
                        {(communication.opened_count || 0) > 1 && (
                          <span className="text-[10px]">{communication.opened_count}</span>
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ouvert {communication.opened_count} fois</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {isClicked && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-0.5 text-purple-500">
                        <MousePointerClick className="h-3.5 w-3.5" />
                        {(communication.clicked_count || 0) > 1 && (
                          <span className="text-[10px]">{communication.clicked_count}</span>
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{communication.clicked_count} clic(s)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
            <span className="text-xs text-muted-foreground font-medium">Objet: </span>
            <span className="text-sm">{communication.subject || 'Sans objet'}</span>
          </div>
          
          {/* Message content */}
          {communication.full_message ? (
            <div 
              className="text-sm text-muted-foreground prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: communication.full_message }}
            />
          ) : communication.message_preview ? (
            <p className="text-sm text-muted-foreground">
              {communication.message_preview}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Aucun contenu disponible
            </p>
          )}
          
          {/* Tracking details for mobile */}
          {hasTracking && !isBounced && (
            <div className="sm:hidden flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
              {isDelivered && (
                <Badge variant="outline" className="text-[10px] text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Délivré
                </Badge>
              )}
              {isOpened && (
                <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                  <Eye className="h-3 w-3 mr-1" />
                  Ouvert {communication.opened_count}x
                </Badge>
              )}
              {isClicked && (
                <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800">
                  <MousePointerClick className="h-3 w-3 mr-1" />
                  Cliqué {communication.clicked_count}x
                </Badge>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
