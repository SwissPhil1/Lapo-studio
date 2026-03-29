import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/shared/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Check, Eye, MousePointerClick, AlertTriangle, Clock } from 'lucide-react';
import type { CampaignWithMetrics } from './CampaignTable';

interface CampaignDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: CampaignWithMetrics | null;
}

interface RecipientLog {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_email: string;
  status: string;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  opened_count: number | null;
  clicked_count: number | null;
  bounce_reason: string | null;
}

export function CampaignDetailDialog({
  open,
  onOpenChange,
  campaign,
}: CampaignDetailDialogProps) {
  const { data: recipients, isLoading } = useQuery({
    queryKey: ['campaign-recipients', campaign?.id],
    queryFn: async () => {
      if (!campaign) return [];
      
      const { data: logs, error } = await supabase
        .from('crm_communication_logs')
        .select(`
          id,
          patient_id,
          status,
          delivered_at,
          opened_at,
          clicked_at,
          opened_count,
          clicked_count,
          bounce_reason
        `)
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch patient names
      const patientIds = logs?.map(l => l.patient_id) || [];
      if (patientIds.length === 0) return [];
      
      const { data: patients } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email')
        .in('id', patientIds);

      const patientMap = new Map(patients?.map(p => [p.id, p]));

      return logs?.map(log => {
        const patient = patientMap.get(log.patient_id);
        return {
          ...log,
          patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Patient inconnu',
          patient_email: patient?.email || '',
        };
      }) as RecipientLog[];
    },
    enabled: open && !!campaign,
  });

  const getStatusIcon = (log: RecipientLog) => {
    if (log.bounce_reason) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
    if (log.clicked_at) {
      return <MousePointerClick className="h-4 w-4 text-success" />;
    }
    if (log.opened_at) {
      return <Eye className="h-4 w-4 text-primary" />;
    }
    if (log.delivered_at) {
      return <Check className="h-4 w-4 text-muted-foreground" />;
    }
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusLabel = (log: RecipientLog) => {
    if (log.bounce_reason) return 'Échec';
    if (log.clicked_at) return 'Cliqué';
    if (log.opened_at) return 'Ouvert';
    if (log.delivered_at) return 'Délivré';
    return 'En attente';
  };

  const getStatusBadgeVariant = (log: RecipientLog): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (log.bounce_reason) return 'destructive';
    if (log.clicked_at) return 'default';
    if (log.opened_at) return 'default';
    if (log.delivered_at) return 'secondary';
    return 'outline';
  };

  // Stats summary
  const stats = recipients?.reduce(
    (acc, log) => {
      acc.total++;
      if (log.delivered_at) acc.delivered++;
      if (log.opened_at) acc.opened++;
      if (log.clicked_at) acc.clicked++;
      if (log.bounce_reason) acc.bounced++;
      return acc;
    },
    { total: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 }
  ) || { total: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };

  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>{campaign.name}</DialogTitle>
        </DialogHeader>

        {/* Stats Summary */}
        <div className="grid grid-cols-5 gap-3 py-4 border-b border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{stats.delivered}</p>
            <p className="text-xs text-muted-foreground">Délivrés</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.opened}</p>
            <p className="text-xs text-muted-foreground">Ouverts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success">{stats.clicked}</p>
            <p className="text-xs text-muted-foreground">Clics</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-destructive">{stats.bounced}</p>
            <p className="text-xs text-muted-foreground">Échecs</p>
          </div>
        </div>

        {/* Recipients List */}
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : recipients && recipients.length > 0 ? (
            <div className="space-y-2">
              {recipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(recipient)}
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {recipient.patient_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {recipient.patient_email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {recipient.opened_count && recipient.opened_count > 1 && (
                      <span className="text-xs text-muted-foreground">
                        {recipient.opened_count}x ouvert
                      </span>
                    )}
                    {recipient.clicked_count && recipient.clicked_count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {recipient.clicked_count}x cliqué
                      </span>
                    )}
                    <Badge variant={getStatusBadgeVariant(recipient)}>
                      {getStatusLabel(recipient)}
                    </Badge>
                    {(recipient.opened_at || recipient.delivered_at) && (
                      <span className="text-xs text-muted-foreground">
                        {format(
                          new Date(recipient.opened_at || recipient.delivered_at!),
                          'dd/MM HH:mm',
                          { locale: fr }
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Aucun destinataire trouvé
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
