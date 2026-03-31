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
import { CampaignTable, type CampaignWithMetrics } from '@/modules/crm/components/campaigns/CampaignTable';
import { CampaignDetailDialog } from '@/modules/crm/components/campaigns/CampaignDetailDialog';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuditTrail } from '@/shared/hooks/useAuditTrail';

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
  const { t } = useTranslation(['campaigns', 'common']);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignWithMetrics | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { logAction } = useAuditTrail();

  // Fetch campaigns with their segments
  const { data: campaigns, isLoading, isError, refetch, isFetching } = useQuery({
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
    onSuccess: (_, campaign) => {
      queryClient.invalidateQueries({ queryKey: ['crm-campaigns'] });
      logAction('create', 'campaign', campaign.id, { action: 'duplicate', name: campaign.name });
      toast.success(t('campaigns:duplicateSuccess'));
    },
    onError: () => {
      toast.error(t('campaigns:duplicateError'));
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
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['crm-campaigns'] });
      logAction('status_change', 'campaign', campaignId, { newStatus: 'archived' });
      toast.success(t('campaigns:archiveSuccess'));
    },
    onError: () => {
      toast.error(t('campaigns:archiveError'));
    }
  });

  const handleDuplicate = (campaign: CampaignWithMetrics) => {
    duplicateMutation.mutate(campaign as Campaign);
  };

  const handleArchive = (campaignId: string) => {
    archiveMutation.mutate(campaignId);
  };

  const handleViewDetails = (campaign: CampaignWithMetrics) => {
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
            <h1 className="text-2xl font-bold text-foreground">{t('campaigns:title')}</h1>
            <p className="text-muted-foreground">{t('campaigns:description')}</p>
          </div>
          <Button
            onClick={() => navigate('/crm/patients')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('campaigns:newCampaign')}
          </Button>
        </div>

        {isError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
            {t('common:loadError', { defaultValue: 'Failed to load data. Please try again.' })}
          </div>
        )}

        {/* Metrics Dashboard */}
        <CampaignMetrics />

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('campaigns:searchPlaceholder')}
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
              <SelectItem value="all">{t('campaigns:allStatuses')}</SelectItem>
              <SelectItem value="draft">{t('campaigns:draft')}</SelectItem>
              <SelectItem value="scheduled">{t('campaigns:scheduled')}</SelectItem>
              <SelectItem value="sending">{t('campaigns:sending')}</SelectItem>
              <SelectItem value="sent">{t('campaigns:sent')}</SelectItem>
              <SelectItem value="completed">{t('campaigns:completed')}</SelectItem>
              <SelectItem value="archived">{t('campaigns:archived')}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            title={t('campaigns:refresh')}
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
                <p className="text-muted-foreground">{t('campaigns:loading')}</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-3">
                <Megaphone className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-lg font-medium text-foreground">{t('campaigns:noCampaigns')}</p>
                <p className="text-muted-foreground text-center max-w-md">
                  {t('campaigns:emptyDescription')}
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/crm/patients')}
                  className="mt-2"
                >
                  {t('campaigns:goToPatients')}
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
