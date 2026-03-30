import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Loader2, TrendingUp, DollarSign, Clock, Target } from 'lucide-react';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import i18n from '@/i18n';
import { getLocale } from '@/shared/lib/format';
import { useTranslation } from 'react-i18next';

interface PipelineSnapshot {
  id: string;
  snapshot_date: string;
  stage_id: string;
  deal_count: number;
  total_value: number;
  avg_deal_value: number;
  conversion_probability: number;
}

export function RevenueForecast() {
  const { t } = useTranslation(['analytics']);
  const { data, isLoading } = useQuery({
    queryKey: ['revenue-forecast'],
    queryFn: async () => {
      // Fetch pipeline stages
      const { error: stagesError } = await supabase
        .from('pipeline_stages')
        .select('id, name, order_index')
        .eq('is_active', true)
        .order('order_index');

      if (stagesError) throw stagesError;
      // Fetch pipeline snapshots
      const { data: snapshots, error: snapshotsError } = await supabase
        .from('crm_pipeline_snapshots')
        .select('id, snapshot_date, stage_id, deal_count, total_value, avg_deal_value, conversion_probability')
        .order('snapshot_date', { ascending: true });

      if (snapshotsError) throw snapshotsError;
      const typedSnapshots = (snapshots || []) as PipelineSnapshot[];

      // Fetch current pipeline patients for live data
      const { data: pipelinePatients, error: ppError } = await supabase
        .from('pipeline_patients')
        .select('id, stage_id, entered_at');

      if (ppError) throw ppError;

      // Calculate current weighted pipeline value
      // Use latest snapshot data per stage or fallback to counts
      const latestByStage = new Map<string, PipelineSnapshot>();
      typedSnapshots.forEach((s) => {
        const existing = latestByStage.get(s.stage_id);
        if (!existing || s.snapshot_date > existing.snapshot_date) {
          latestByStage.set(s.stage_id, s);
        }
      });

      let weightedPipeline = 0;
      let totalDeals = 0;
      let totalValue = 0;

      latestByStage.forEach((snapshot) => {
        const weighted = snapshot.deal_count * snapshot.avg_deal_value * snapshot.conversion_probability;
        weightedPipeline += weighted;
        totalDeals += snapshot.deal_count;
        totalValue += snapshot.total_value;
      });

      // If no snapshots, estimate from pipeline_patients counts
      if (typedSnapshots.length === 0 && pipelinePatients) {
        totalDeals = pipelinePatients.length;
        // Use a default average deal value estimate
        const defaultAvgDeal = 500;
        const defaultConversion = 0.3;
        weightedPipeline = totalDeals * defaultAvgDeal * defaultConversion;
        totalValue = totalDeals * defaultAvgDeal;
      }

      // Calculate average deal velocity (days from enter to conversion)
      const velocityDays: number[] = [];
      (pipelinePatients || []).forEach((pp) => {
        if (pp.entered_at) {
          const days = differenceInDays(new Date(), new Date(pp.entered_at));
          if (days > 0) velocityDays.push(days);
        }
      });
      const avgVelocity =
        velocityDays.length > 0
          ? Math.round(velocityDays.reduce((a, b) => a + b, 0) / velocityDays.length)
          : 0;

      // 30/60/90 day projections
      // Use a simple linear model based on current weighted pipeline and velocity
      const monthlyRate = avgVelocity > 0 ? 30 / avgVelocity : 1;
      const forecast30 = Math.round(weightedPipeline * Math.min(monthlyRate, 1));
      const forecast60 = Math.round(weightedPipeline * Math.min(monthlyRate * 2, 1.5));
      const forecast90 = Math.round(weightedPipeline * Math.min(monthlyRate * 3, 2));

      // Trend data from snapshots by date
      const dateMap = new Map<string, number>();
      typedSnapshots.forEach((s) => {
        const dateKey = s.snapshot_date;
        const weighted = s.deal_count * s.avg_deal_value * s.conversion_probability;
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + weighted);
      });

      const trendData = Array.from(dateMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({
          date: format(parseISO(date), 'dd MMM', { locale: i18n.language === 'fr' ? frLocale : enUS }),
          valeur: Math.round(value),
        }));

      // Add projection points
      const today = new Date();
      const projectionData = [
        ...trendData,
        ...(trendData.length > 0
          ? [
              {
                date: format(addDays(today, 30), 'dd MMM', { locale: i18n.language === 'fr' ? frLocale : enUS }),
                valeur: forecast30,
              },
              {
                date: format(addDays(today, 60), 'dd MMM', { locale: i18n.language === 'fr' ? frLocale : enUS }),
                valeur: forecast60,
              },
              {
                date: format(addDays(today, 90), 'dd MMM', { locale: i18n.language === 'fr' ? frLocale : enUS }),
                valeur: forecast90,
              },
            ]
          : []),
      ];

      return {
        weightedPipeline: Math.round(weightedPipeline),
        forecast30,
        forecast60,
        forecast90,
        avgVelocity,
        totalDeals,
        trendData: projectionData,
      };
    },
  });

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
        <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">{t('analytics:noForecastData')}</p>
        <p className="text-sm mt-1">Les donn\u00e9es du pipeline appara\u00eetront ici.</p>
      </div>
    );
  }

  const formatCHF = (value: number) =>
    new Intl.NumberFormat(getLocale(), { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(value);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <Target className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{formatCHF(data.weightedPipeline)}</p>
          <p className="text-sm text-muted-foreground">Pipeline pond\u00e9r\u00e9</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <DollarSign className="h-5 w-5 mx-auto text-emerald-600 mb-2" />
          <p className="text-2xl font-bold">{formatCHF(data.forecast30)}</p>
          <p className="text-sm text-muted-foreground">Pr\u00e9vision 30j</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{formatCHF(data.forecast90)}</p>
          <p className="text-sm text-muted-foreground">Pr\u00e9vision 90j</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
          <p className="text-2xl font-bold">{data.avgVelocity}j</p>
          <p className="text-sm text-muted-foreground">V\u00e9locit\u00e9 moyenne</p>
        </div>
      </div>

      {/* Projection cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground mb-1">30 jours</p>
          <p className="text-xl font-bold text-foreground">{formatCHF(data.forecast30)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground mb-1">60 jours</p>
          <p className="text-xl font-bold text-foreground">{formatCHF(data.forecast60)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground mb-1">90 jours</p>
          <p className="text-xl font-bold text-foreground">{formatCHF(data.forecast90)}</p>
        </div>
      </div>

      {/* Trend chart */}
      {data.trendData.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Tendance et projections
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: any) => [formatCHF(value), 'Valeur']}
              />
              <Line
                type="monotone"
                dataKey="valeur"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                strokeDasharray="0"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
