import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MoreHorizontal,
  Eye,
  Copy,
  Archive,
  Users,
  Send,
  Clock,
  Loader2,
} from 'lucide-react';

export interface CampaignWithMetrics {
  id: string;
  name: string;
  segment_id: string | null;
  segment?: { name: string } | null;
  channel: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  recipients: number;
  delivered: number;
  opened: number;
  clicked: number;
}

interface CampaignTableProps {
  scheduledCampaigns: CampaignWithMetrics[];
  sentCampaigns: CampaignWithMetrics[];
  onViewDetails: (campaign: CampaignWithMetrics) => void;
  onDuplicate: (campaign: CampaignWithMetrics) => void;
  onArchive: (campaignId: string) => void;
  isDuplicating?: boolean;
  isArchiving?: boolean;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  scheduled: { label: 'Programmé', variant: 'outline' },
  sending: { label: 'En cours', variant: 'default' },
  sent: { label: 'Envoyé', variant: 'default' },
  completed: { label: 'Terminé', variant: 'secondary' },
  archived: { label: 'Archivée', variant: 'secondary' },
};

export function CampaignTable({
  scheduledCampaigns,
  sentCampaigns,
  onViewDetails,
  onDuplicate,
  onArchive,
  isDuplicating,
  isArchiving,
}: CampaignTableProps) {
  const [archiveTarget, setArchiveTarget] = useState<CampaignWithMetrics | null>(null);

  const renderCampaignRow = (campaign: CampaignWithMetrics, isScheduled: boolean) => {
    const openRate = campaign.recipients > 0 ? Math.round((campaign.opened / campaign.recipients) * 100) : 0;
    const clickRate = campaign.recipients > 0 ? Math.round((campaign.clicked / campaign.recipients) * 100) : 0;
    const deliveryRate = campaign.recipients > 0 ? Math.round((campaign.delivered / campaign.recipients) * 100) : 0;
    const status = statusConfig[campaign.status] || statusConfig.draft;

    return (
      <TableRow key={campaign.id} className="group hover:bg-muted/50">
        <TableCell>
          <div className="max-w-[200px]">
            <p className="font-medium text-foreground truncate">{campaign.name}</p>
            {campaign.segment?.name && (
              <p className="text-xs text-muted-foreground truncate">{campaign.segment.name}</p>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            {campaign.recipients}
          </div>
        </TableCell>
        <TableCell>
          {campaign.scheduled_at ? (
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {format(new Date(campaign.scheduled_at), 'dd MMM HH:mm', { locale: fr })}
            </div>
          ) : campaign.created_at ? (
            <div className="text-sm text-muted-foreground">
              {format(new Date(campaign.created_at), 'dd MMM yyyy', { locale: fr })}
            </div>
          ) : (
            '-'
          )}
        </TableCell>
        {!isScheduled && (
          <>
            <TableCell>
              <div className="space-y-1 min-w-[100px]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Délivrés</span>
                  <span className="font-medium">{deliveryRate}%</span>
                </div>
                <Progress value={deliveryRate} className="h-1.5" />
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1 min-w-[100px]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Ouverts</span>
                  <span className="font-medium">{openRate}%</span>
                </div>
                <Progress value={openRate} className="h-1.5" />
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1 min-w-[100px]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Clics</span>
                  <span className="font-medium">{clickRate}%</span>
                </div>
                <Progress value={clickRate} className="h-1.5" />
              </div>
            </TableCell>
          </>
        )}
        <TableCell>
          <Badge variant={status.variant}>{status.label}</Badge>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(campaign)}>
                <Eye className="h-4 w-4 mr-2" />
                Voir détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(campaign)} disabled={isDuplicating}>
                {isDuplicating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setArchiveTarget(campaign)} 
                className="text-destructive"
                disabled={isArchiving}
              >
                {isArchiving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4 mr-2" />
                )}
                Archiver
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  const TableHeaders = ({ isScheduled }: { isScheduled: boolean }) => (
    <TableHeader>
      <TableRow>
        <TableHead>Campagne</TableHead>
        <TableHead>Destinataires</TableHead>
        <TableHead>{isScheduled ? 'Prévu le' : 'Envoyé le'}</TableHead>
        {!isScheduled && (
          <>
            <TableHead>Délivrés</TableHead>
            <TableHead>Ouverts</TableHead>
            <TableHead>Clics</TableHead>
          </>
        )}
        <TableHead>Statut</TableHead>
        <TableHead className="w-[50px]"></TableHead>
      </TableRow>
    </TableHeader>
  );

  const allCampaigns = [...scheduledCampaigns, ...sentCampaigns];
  
  if (allCampaigns.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucune campagne trouvée</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scheduled Campaigns Section */}
      {scheduledCampaigns.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="h-4 w-4" />
            Programmées ({scheduledCampaigns.length})
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeaders isScheduled={true} />
              <TableBody>
                {scheduledCampaigns.map(c => renderCampaignRow(c, true))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Sent/Other Campaigns Section */}
      {sentCampaigns.length > 0 && (
        <div className="space-y-3">
          {scheduledCampaigns.length > 0 && (
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Send className="h-4 w-4" />
              Envoyées ({sentCampaigns.length})
            </div>
          )}
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeaders isScheduled={false} />
              <TableBody>
                {sentCampaigns.map(c => renderCampaignRow(c, false))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver cette campagne ?</AlertDialogTitle>
            <AlertDialogDescription>
              La campagne "{archiveTarget?.name}" sera archivée. Vous pourrez toujours la retrouver en filtrant par statut "Archivée".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (archiveTarget) {
                  onArchive(archiveTarget.id);
                  setArchiveTarget(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}