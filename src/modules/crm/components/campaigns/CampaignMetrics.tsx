import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, Mail, MousePointerClick, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CampaignMetricsData {
  activeCampaigns: number;
  totalSent: number;
  avgOpenRate: number;
  bestCampaign: { name: string; openRate: number } | null;
}

export function CampaignMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['campaign-metrics'],
    queryFn: async (): Promise<CampaignMetricsData> => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get campaigns from last 30 days
      const { data: campaigns } = await supabase
        .from('crm_campaigns')
        .select('id, name, status, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .neq('status', 'archived');

      const activeCampaigns = campaigns?.filter(c => 
        c.status === 'sent' || c.status === 'sending' || c.status === 'completed'
      ).length || 0;

      // Get communication logs for campaigns only (not individual emails)
      const { data: logs } = await supabase
        .from('crm_communication_logs')
        .select('campaign_id, opened_at')
        .gte('sent_at', thirtyDaysAgo.toISOString())
        .not('campaign_id', 'is', null); // Only campaign emails

      const totalSent = logs?.length || 0;
      const totalOpened = logs?.filter(l => l.opened_at).length || 0;
      const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

      // Find best campaign
      let bestCampaign: { name: string; openRate: number } | null = null;
      if (campaigns && campaigns.length > 0 && logs) {
        const campaignStats = campaigns.map(campaign => {
          const campaignLogs = logs.filter(l => l.campaign_id === campaign.id);
          const sent = campaignLogs.length;
          const opened = campaignLogs.filter(l => l.opened_at).length;
          const openRate = sent > 0 ? (opened / sent) * 100 : 0;
          return { name: campaign.name, openRate, sent };
        }).filter(c => c.sent >= 5); // Only campaigns with at least 5 recipients

        if (campaignStats.length > 0) {
          const best = campaignStats.reduce((a, b) => a.openRate > b.openRate ? a : b);
          bestCampaign = { name: best.name, openRate: Math.round(best.openRate) };
        }
      }

      return {
        activeCampaigns,
        totalSent,
        avgOpenRate,
        bestCampaign
      };
    }
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Campagnes ce mois',
      value: metrics?.activeCampaigns || 0,
      icon: Megaphone,
      color: 'text-blue-500'
    },
    {
      label: 'Emails envoyés',
      value: metrics?.totalSent || 0,
      icon: Mail,
      color: 'text-green-500'
    },
    {
      label: 'Taux d\'ouverture',
      value: `${metrics?.avgOpenRate || 0}%`,
      icon: MousePointerClick,
      color: 'text-purple-500'
    },
    {
      label: 'Meilleure campagne',
      value: metrics?.bestCampaign?.name || '-',
      subtitle: metrics?.bestCampaign ? `${metrics.bestCampaign.openRate}% ouverture` : undefined,
      icon: Trophy,
      color: 'text-amber-500',
      truncate: true
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.truncate ? 'truncate' : ''}`} title={typeof stat.value === 'string' ? stat.value : undefined}>
                  {stat.value}
                </p>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                )}
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color} opacity-80 flex-shrink-0`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
