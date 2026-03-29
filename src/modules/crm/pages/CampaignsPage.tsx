// @ts-nocheck
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, Megaphone, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { CampaignMetrics } from '@/modules/crm/components/campaigns/CampaignMetrics';
import { CampaignTable } from '@/modules/crm/components/campaigns/CampaignTable';
import { CampaignDetailDialog } from '@/modules/crm/components/campaigns/CampaignDetailDialog';
import { useNavigate } from 'react-router-dom';

export interface Campaign {
  id: string;
  name: string;
  segment_id: string | null;
  channel: string;
  message_template: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  segment?: { name: string } | null;
  // Computed metrics
  recipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
}

const CAMPAIGNS_PER_PAGE = 20;

export default function Campaigns() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch campaigns with their segments
  const { data: campaigns, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['crm-campaigns'],
    queryFn: async () => {
      const { data: campaignsData, error } = await supabase
        .from('crm_campaigns')
        .select(`
          *,
          segment:crm_segments(name)
        `)
        .order('created_at', { ascending: false })
        .limit(CAMPAIGNS_PER_PAGE);

      if (error) throw error;
      if (!campaignsData) return [];

      // Get communication logs for metrics
      const campaignIds = campaignsData.map(c => c.id);
      const { data: logs } = await supabase
        .from('crm_communication_logs')
        .select('campaign_id, status, opened_at, clicked_at, bounced_at')
        .in('campaign_id', campaignIds);

      // Calculate metrics per campaign
      return campaignsData.map(campaign => {
        const campaignLogs = logs?.filter(l => l.campaign_id === campaign.id) || [];
        const recipients = campaignLogs.length;
        const delivered = campaignLogs.filter(l => l.status === 'delivered' || l.status === 'sent' || l.opened_at).length;
        const opened = campaignLogs.filter(l => l.opened_at).length;
        const clicked = campaignLogs.filter(l => l.clicked_at).length;
        const bounced = campaignLogs.filter(l => l.bounced_at || l.status === 'bounced').length;

        // Handle segment being object or array
        const segmentData = campaign.segment;
        const segment = Array.isArray(segmentData) ? segmentData[0] : segmentData;

        return {
          ...campaign,
          segment,
          recipients,
          delivered,
          opened,
          clicked,
          bounced
        } as Campaign;
      });
    }
  });

  // Duplicate campaign mutation
  const duplicateMutation = useMutation({
    mutationFn: async (campaign: Campaign) => {
      const { error } = await supabase
        .from('crm_campaigns')
        .insert({
          name: `${campaign.name} (copie)`,
          segment_id: campaign.segment_id,
          channel: campaign.channel,
          message_template: campaign.message_template, // Keep the original template
          status: 'draft',
          scheduled_at: null
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-campaigns'] });
      toast.success('Campagne dupliquée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la duplication');
    }
  });

  // Archive campaign mutation
  const archiveMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('crm_campaigns')
        .update({ status: 'archived' })
        .eq('id', campaignId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-campaigns'] });
      toast.success('Campagne archivée');
    },
    onError: () => {
      toast.error('Erreur lors de l\'archivage');
    }
  });

  const handleDuplicate = (campaign: Campaign) => {
    duplicateMutation.mutate(campaign);
  };

  const handleArchive = (campaignId: string) => {
    archiveMutation.mutate(campaignId);
  };

  const handleViewDetails = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setDetailOpen(true);
  };

  // Filter campaigns
  const filteredCampaigns = campaigns?.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Separate scheduled vs sent campaigns
  const scheduledCampaigns = filteredCampaigns.filter(c => c.status === 'scheduled');
  const otherCampaigns = filteredCampaigns.filter(c => c.status !== 'scheduled');

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Campagnes</h1>
            <p className="text-muted-foreground">Gérez vos campagnes marketing et suivez leurs performances</p>
          </div>
          <Button 
            onClick={() => navigate('/crm/patients')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Campagne
          </Button>
        </div>

        {/* Metrics Dashboard */}
        <CampaignMetrics />

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une campagne..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="scheduled">Programmée</SelectItem>
              <SelectItem value="sending">En cours</SelectItem>
              <SelectItem value="sent">Envoyée</SelectItem>
              <SelectItem value="completed">Terminée</SelectItem>
              <SelectItem value="archived">Archivée</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Chargement des campagnes...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-3">
                <Megaphone className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-lg font-medium text-foreground">Aucune campagne</p>
                <p className="text-muted-foreground text-center max-w-md">
                  Créez votre première campagne depuis la page Patients en sélectionnant un groupe de patients ou en utilisant la recherche IA.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/crm/patients')}
                  className="mt-2"
                >
                  Aller à la page Patients
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <CampaignTable
            scheduledCampaigns={scheduledCampaigns}
            sentCampaigns={otherCampaigns}
            onViewDetails={handleViewDetails}
            onDuplicate={handleDuplicate}
            onArchive={handleArchive}
            isDuplicating={duplicateMutation.isPending}
            isArchiving={archiveMutation.isPending}
          />
        )}

        {/* Campaign Detail Dialog */}
        <CampaignDetailDialog
          campaign={selectedCampaign}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
    </div>
  );
}
