import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared/lib/supabase';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Loader2, DollarSign, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/shared/lib/format';
import { format, parseISO } from 'date-fns';
import { BOOKING_STATUS } from '@/shared/lib/bookingStatus';
import { DrillDownPanel, type DrillDownData } from './DrillDownPanel';

export function CACAnalysis() {
  const { t } = useTranslation(['analytics']);
  const [drillDown, setDrillDown] = useState<DrillDownData | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['cac-analysis'],
    queryFn: async () => {
      // Fetch ad spend data
      const { data: adSpend } = await supabase
        .from('crm_ad_spend')
        .select('id, utm_source, spend_amount, spend_date');

      // Fetch converted leads
      const { data: leads } = await supabase
        .from('crm_leads')
        .select('id, utm_source, status, created_at');

      // Fetch patient LTV data for LTV:CAC ratio
      const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_value, patient_id, patient:patient_id(utm_source, lead_source)')
        .eq('is_test', false)
        .eq('status', BOOKING_STATUS.COMPLETED);

      const hasRealData = (adSpend && adSpend.length > 0) || (leads && leads.length > 0);

      // Use real data if available, otherwise use demo data
      if (!hasRealData) {
        return buildDemoData(t);
      }

      // Calculate LTV per source
      const sourceLTVMap = new Map<string, { totalRevenue: number; patientIds: Set<string> }>();
      (bookings || []).forEach((b: any) => {
        const src = b.patient?.utm_source || b.patient?.lead_source || 'direct';
        const existing = sourceLTVMap.get(src) || { totalRevenue: 0, patientIds: new Set<string>() };
        existing.totalRevenue += b.booking_value || 0;
        existing.patientIds.add(b.patient_id);
        sourceLTVMap.set(src, existing);
      });

      // Calculate CAC by channel
      const channelMap = new Map<string, { spend: number; conversions: number }>();

      (adSpend || []).forEach((s: any) => {
        const source = s.utm_source || 'direct';
        const existing = channelMap.get(source) || { spend: 0, conversions: 0 };
        existing.spend += s.spend_amount || 0;
        channelMap.set(source, existing);
      });

      (leads || []).forEach((l: any) => {
        const source = l.utm_source || 'direct';
        const existing = channelMap.get(source) || { spend: 0, conversions: 0 };
        if (l.status === 'converted') existing.conversions++;
        channelMap.set(source, existing);
      });

      const byChannel = Array.from(channelMap.entries())
        .filter(([, d]) => d.spend > 0 || d.conversions > 0)
        .map(([source, d]) => {
          const cac = d.conversions > 0 ? Math.round(d.spend / d.conversions) : 0;
          const ltvData = sourceLTVMap.get(source);
          const avgLtv = ltvData && ltvData.patientIds.size > 0
            ? Math.round(ltvData.totalRevenue / ltvData.patientIds.size)
            : 0;
          const ratio = cac > 0 ? parseFloat((avgLtv / cac).toFixed(1)) : 0;
          const roi = cac > 0 ? Math.round(((avgLtv - cac) / cac) * 100) : 0;

          return { source, spend: d.spend, conversions: d.conversions, cac, avgLtv, ratio, roi };
        })
        .sort((a, b) => b.spend - a.spend);

      // Overall KPIs
      const totalSpend = byChannel.reduce((sum, c) => sum + c.spend, 0);
      const totalConversions = byChannel.reduce((sum, c) => sum + c.conversions, 0);
      const overallCAC = totalConversions > 0 ? Math.round(totalSpend / totalConversions) : 0;

      // Overall LTV
      const allLTVs = Array.from(sourceLTVMap.values());
      const totalRevenue = allLTVs.reduce((sum, d) => sum + d.totalRevenue, 0);
      const totalPatients = new Set(allLTVs.flatMap(d => [...d.patientIds])).size;
      const overallLTV = totalPatients > 0 ? Math.round(totalRevenue / totalPatients) : 0;
      const overallRatio = overallCAC > 0 ? parseFloat((overallLTV / overallCAC).toFixed(1)) : 0;

      // CAC trend by month (group ad spend by month)
      const monthlyMap = new Map<string, { spend: number; conversions: number }>();
      (adSpend || []).forEach((s: any) => {
        if (!s.spend_date) return;
        const month = format(parseISO(s.spend_date), 'yyyy-MM');
        const existing = monthlyMap.get(month) || { spend: 0, conversions: 0 };
        existing.spend += s.spend_amount || 0;
        monthlyMap.set(month, existing);
      });
      (leads || []).forEach((l: any) => {
        if (!l.created_at || l.status !== 'converted') return;
        const month = format(parseISO(l.created_at), 'yyyy-MM');
        const existing = monthlyMap.get(month) || { spend: 0, conversions: 0 };
        existing.conversions++;
        monthlyMap.set(month, existing);
      });

      const cacTrend = Array.from(monthlyMap.entries())
        .map(([month, d]) => ({
          month,
          label: format(parseISO(month + '-01'), 'MMM yy'),
          cac: d.conversions > 0 ? Math.round(d.spend / d.conversions) : 0,
          spend: d.spend,
          conversions: d.conversions,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12);

      return {
        byChannel,
        overallCAC,
        overallLTV,
        overallRatio,
        totalSpend,
        totalConversions,
        cacTrend,
        isDemo: false,
      };
    },
  });

  const handleChannelClick = useCallback((channelData: any) => {
    if (!data || !channelData) return;
    const channel = data.byChannel.find(c => c.source === channelData.source);
    if (!channel) return;
    setDrillDown({
      title: t('analytics:cac.drillDownChannel'),
      subtitle: channel.source,
      columns: [
        { key: 'metric', label: t('analytics:cac.colMetric') },
        { key: 'value', label: t('analytics:cac.colValue') },
      ],
      rows: [
        { metric: t('analytics:cac.totalSpend'), value: formatCurrency(channel.spend) },
        { metric: t('analytics:cac.conversions'), value: String(channel.conversions) },
        { metric: t('analytics:cac.cacLabel'), value: formatCurrency(channel.cac) },
        { metric: t('analytics:cac.avgLtv'), value: formatCurrency(channel.avgLtv) },
        { metric: t('analytics:cac.ltvCacRatio'), value: `${channel.ratio}:1` },
        { metric: t('analytics:cac.roiLabel'), value: `${channel.roi}%` },
      ],
    });
  }, [data, t]);

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">{t('analytics:cac.noData')}</p>
      </div>
    );
  }

  const getRatioColor = (ratio: number) => {
    if (ratio >= 3) return 'text-emerald-600';
    if (ratio >= 1) return 'text-amber-600';
    return 'text-red-600';
  };

  const getRatioBg = (ratio: number) => {
    if (ratio >= 3) return 'bg-emerald-50 dark:bg-emerald-950/30';
    if (ratio >= 1) return 'bg-amber-50 dark:bg-amber-950/30';
    return 'bg-red-50 dark:bg-red-950/30';
  };

  return (
    <div className="space-y-6">
      {data.isDemo && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {t('analytics:cac.demoNotice')}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <DollarSign className="h-5 w-5 mx-auto text-destructive mb-2" />
          <p className="text-2xl font-bold">{formatCurrency(data.overallCAC)}</p>
          <p className="text-sm text-muted-foreground">{t('analytics:cac.overallCac')}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{formatCurrency(data.overallLTV)}</p>
          <p className="text-sm text-muted-foreground">{t('analytics:cac.overallLtv')}</p>
        </div>
        <div className={`rounded-lg p-4 text-center ${getRatioBg(data.overallRatio)}`}>
          <TrendingUp className={`h-5 w-5 mx-auto mb-2 ${getRatioColor(data.overallRatio)}`} />
          <p className={`text-2xl font-bold ${getRatioColor(data.overallRatio)}`}>
            {data.overallRatio}:1
          </p>
          <p className="text-sm text-muted-foreground">{t('analytics:cac.ltvCacRatio')}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <Users className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{data.totalConversions}</p>
          <p className="text-sm text-muted-foreground">{t('analytics:cac.totalConversions')}</p>
        </div>
      </div>

      {/* Ratio health indicator */}
      <div className={`rounded-lg p-4 ${getRatioBg(data.overallRatio)}`}>
        <p className={`text-sm font-medium ${getRatioColor(data.overallRatio)}`}>
          {data.overallRatio >= 3
            ? t('analytics:cac.ratioHealthy')
            : data.overallRatio >= 1
              ? t('analytics:cac.ratioWarning')
              : t('analytics:cac.ratioCritical')}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('analytics:cac.ratioExplanation')}
        </p>
      </div>

      {/* CAC by Channel */}
      {data.byChannel.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            {t('analytics:cac.byChannelTitle')}
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.byChannel.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="source" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: any, name: any) => [formatCurrency(value), name]}
              />
              <Legend />
              <Bar
                dataKey="cac"
                name={t('analytics:cac.cacLabel')}
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(entry: any) => handleChannelClick(entry)}
              />
              <Bar
                dataKey="avgLtv"
                name={t('analytics:cac.avgLtv')}
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(entry: any) => handleChannelClick(entry)}
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {t('analytics:ltv.clickToExplore')}
          </p>
        </div>
      )}

      {/* ROI by Channel */}
      {data.byChannel.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            {t('analytics:cac.roiByChannelTitle')}
          </h4>
          <div className="space-y-2">
            {data.byChannel.map((channel) => (
              <div
                key={channel.source}
                className="flex items-center justify-between bg-secondary/30 rounded-lg px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => handleChannelClick(channel)}
              >
                <span className="text-sm font-medium">{channel.source}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    CAC: {formatCurrency(channel.cac)}
                  </span>
                  <span className={`font-medium ${getRatioColor(channel.ratio)}`}>
                    {channel.ratio}:1
                  </span>
                  <span className={`font-medium ${channel.roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {channel.roi > 0 ? '+' : ''}{channel.roi}% ROI
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CAC Trend */}
      {data.cacTrend.length > 1 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            {t('analytics:cac.trendTitle')}
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.cacTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(v) => formatCurrency(v)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: any) => [formatCurrency(value), t('analytics:cac.cacLabel')]}
              />
              <Line
                type="monotone"
                dataKey="cac"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <DrillDownPanel data={drillDown} onClose={() => setDrillDown(null)} />
    </div>
  );
}

function buildDemoData(_t: (key: string) => string) {
  const channels = ['Google Ads', 'Meta', 'Instagram', 'SEO', 'Referral'];
  const byChannel = channels.map((source, i) => {
    const spend = [4500, 3200, 2100, 800, 200][i];
    const conversions = [18, 12, 8, 15, 10][i];
    const cac = conversions > 0 ? Math.round(spend / conversions) : 0;
    const avgLtv = [1200, 950, 1100, 1400, 1800][i];
    const ratio = cac > 0 ? parseFloat((avgLtv / cac).toFixed(1)) : 0;
    const roi = cac > 0 ? Math.round(((avgLtv - cac) / cac) * 100) : 0;
    return { source, spend, conversions, cac, avgLtv, ratio, roi };
  });

  const totalSpend = byChannel.reduce((s, c) => s + c.spend, 0);
  const totalConversions = byChannel.reduce((s, c) => s + c.conversions, 0);
  const overallCAC = totalConversions > 0 ? Math.round(totalSpend / totalConversions) : 0;
  const overallLTV = 1250;
  const overallRatio = overallCAC > 0 ? parseFloat((overallLTV / overallCAC).toFixed(1)) : 0;

  const months = ['Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26'];
  const cacTrend = months.map((label, i) => ({
    month: `2025-${String(i + 10).padStart(2, '0')}`,
    label,
    cac: [210, 195, 185, 175, 168, 160][i],
    spend: [3000, 2800, 2600, 2900, 3100, 2800][i],
    conversions: [14, 14, 14, 17, 18, 18][i],
  }));

  return {
    byChannel,
    overallCAC,
    overallLTV,
    overallRatio,
    totalSpend,
    totalConversions,
    cacTrend,
    isDemo: true,
  };
}
