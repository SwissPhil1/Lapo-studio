import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { subDays, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Loader2, Mail, Eye, MousePointerClick, AlertTriangle } from 'lucide-react';

interface CampaignPerformanceProps {
  dateRange: string;
}

function getDateRange(range: string): Date {
  const end = new Date();

  switch (range) {
    case '7d':
      return subDays(end, 7);
    case '30d':
      return subDays(end, 30);
    case '90d':
      return subDays(end, 90);
    case '12m':
      return subMonths(end, 12);
    case 'ytd':
      return new Date(end.getFullYear(), 0, 1);
    default:
      return subMonths(end, 12);
  }
}

export function CampaignPerformance({ dateRange }: CampaignPerformanceProps) {
  const { t } = useTranslation(['analytics']);
  const start = getDateRange(dateRange);

  const { data, isLoading } = useQuery({
    queryKey: ['campaign-performance', dateRange],
    queryFn: async () => {
      const { data: campaigns } = await supabase
        .from('crm_campaigns')
        .select('id, name, channel, status, created_at')
        .gte('created_at', start.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (!campaigns || campaigns.length === 0) {
        return { campaigns: [], totals: null };
      }

      const campaignIds = campaigns.map(c => c.id);
      const { data: logs } = await supabase
        .from('crm_communication_logs')
        .select('campaign_id, status, opened_at, clicked_at, bounced_at')
        .in('campaign_id', campaignIds);

      const campaignMetrics = campaigns.map(campaign => {
        const campaignLogs = logs?.filter(l => l.campaign_id === campaign.id) || [];
        const sent = campaignLogs.length;
        const opened = campaignLogs.filter(l => l.opened_at).length;
        const clicked = campaignLogs.filter(l => l.clicked_at).length;
        const bounced = campaignLogs.filter(l => l.bounced_at).length;

        return {
          name: campaign.name.length > 20 ? campaign.name.substring(0, 20) + '...' : campaign.name,
          fullName: campaign.name,
          sent,
          opened,
          clicked,
          bounced,
          openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0',
          clickRate: opened > 0 ? ((clicked / opened) * 100).toFixed(1) : '0',
          bounceRate: sent > 0 ? ((bounced / sent) * 100).toFixed(1) : '0',
        };
      });

      const allLogs = logs || [];
      const totalSent = allLogs.length;
      const totalOpened = allLogs.filter(l => l.opened_at).length;
      const totalClicked = allLogs.filter(l => l.clicked_at).length;
      const totalBounced = allLogs.filter(l => l.bounced_at).length;

      return {
        campaigns: campaignMetrics,
        totals: {
          sent: totalSent,
          opened: totalOpened,
          clicked: totalClicked,
          bounced: totalBounced,
          openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0',
          clickRate: totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : '0',
          bounceRate: totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) : '0',
        },
      };
    },
  });

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.campaigns || data.campaigns.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{t('analytics:noCampaignsPeriod')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {data.totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{t('analytics:campaignSent')}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.totals.sent}</p>
          </div>
          <div className="bg-blue-500/5 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Eye className="h-4 w-4" />
              <span className="text-sm">{t('analytics:openRate')}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.totals.openRate}%</p>
          </div>
          <div className="bg-green-500/5 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <MousePointerClick className="h-4 w-4" />
              <span className="text-sm">{t('analytics:clickRate')}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.totals.clickRate}%</p>
          </div>
          <div className="bg-destructive/5 rounded-lg p-4">
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{t('analytics:bounceRate')}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.totals.bounceRate}%</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {data.campaigns.length > 0 && (
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.campaigns} margin={{ left: 0, right: 20 }}>
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: any, name: any) => {
                  const labels: Record<string, string> = {
                    sent: t('analytics:campaignSent'),
                    opened: t('analytics:campaignOpened'),
                    clicked: t('analytics:campaignClicked'),
                  };
                  return [value, labels[name] || name];
                }}
              />
              <Legend
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    sent: t('analytics:campaignSent'),
                    opened: t('analytics:campaignOpened'),
                    clicked: t('analytics:campaignClicked'),
                  };
                  return labels[value] || value;
                }}
              />
              <Bar dataKey="sent" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="opened" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clicked" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
