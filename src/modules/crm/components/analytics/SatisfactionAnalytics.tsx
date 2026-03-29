// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Loader2, ThumbsUp, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SurveyResponse {
  id: string;
  survey_id: string;
  score: number;
  comment: string | null;
  created_at: string;
  survey_type: string;
}

export function SatisfactionAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['satisfaction-analytics'],
    queryFn: async () => {
      // Fetch survey responses joined with surveys for type
      const { data: responses, error } = await supabase
        .from('crm_survey_responses')
        .select('id, survey_id, score, comment, created_at, survey:crm_surveys(type)')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const typedResponses: SurveyResponse[] = (responses || []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        survey_id: r.survey_id as string,
        score: r.score as number,
        comment: r.comment as string | null,
        created_at: r.created_at as string,
        survey_type: (r.survey as Record<string, unknown>)?.type as string || 'nps',
      }));

      // Separate NPS and CSAT responses
      const npsResponses = typedResponses.filter((r) => r.survey_type === 'nps');
      const csatResponses = typedResponses.filter((r) => r.survey_type === 'csat');

      // NPS calculation: Promoters (9-10) - Detractors (0-6), as percentage
      const promoters = npsResponses.filter((r) => r.score >= 9).length;
      const passives = npsResponses.filter((r) => r.score >= 7 && r.score <= 8).length;
      const detractors = npsResponses.filter((r) => r.score <= 6).length;
      const totalNps = npsResponses.length;
      const npsScore =
        totalNps > 0
          ? Math.round(((promoters - detractors) / totalNps) * 100)
          : 0;

      // CSAT average
      const csatAvg =
        csatResponses.length > 0
          ? (csatResponses.reduce((sum, r) => sum + r.score, 0) / csatResponses.length).toFixed(1)
          : '0.0';

      // Total responses
      const totalResponses = typedResponses.length;

      // Response rate - approximate based on sent surveys vs responses
      const { count: sentCount } = await supabase
        .from('crm_survey_responses')
        .select('id', { count: 'exact', head: true });

      const { count: totalSurveysSent } = await supabase
        .from('crm_communication_logs')
        .select('id', { count: 'exact', head: true })
        .eq('channel', 'sms')
        .ilike('message_preview', '%enquete%');

      const responseRate =
        totalSurveysSent && totalSurveysSent > 0
          ? Math.round(((sentCount || 0) / totalSurveysSent) * 100)
          : 0;

      // Trend data - NPS by month
      const monthMap = new Map<string, { promoters: number; detractors: number; total: number }>();
      npsResponses.forEach((r) => {
        const month = format(parseISO(r.created_at), 'yyyy-MM');
        const entry = monthMap.get(month) || { promoters: 0, detractors: 0, total: 0 };
        entry.total++;
        if (r.score >= 9) entry.promoters++;
        if (r.score <= 6) entry.detractors++;
        monthMap.set(month, entry);
      });

      const trendData = Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, d]) => ({
          month: format(parseISO(`${month}-01`), 'MMM yy', { locale: fr }),
          nps: d.total > 0 ? Math.round(((d.promoters - d.detractors) / d.total) * 100) : 0,
        }));

      // Score distribution
      const distribution = new Map<number, number>();
      typedResponses.forEach((r) => {
        distribution.set(r.score, (distribution.get(r.score) || 0) + 1);
      });

      // Determine max score range based on types present
      const maxScore = npsResponses.length > 0 ? 10 : 5;
      const distributionData = Array.from({ length: maxScore + 1 }, (_, i) => ({
        score: i.toString(),
        count: distribution.get(i) || 0,
      }));

      // NPS category breakdown for display
      const npsBreakdown = {
        promoters,
        passives,
        detractors,
        promotersPct: totalNps > 0 ? Math.round((promoters / totalNps) * 100) : 0,
        passivesPct: totalNps > 0 ? Math.round((passives / totalNps) * 100) : 0,
        detractorsPct: totalNps > 0 ? Math.round((detractors / totalNps) * 100) : 0,
      };

      return {
        npsScore,
        csatAvg,
        totalResponses,
        responseRate,
        trendData,
        distributionData,
        npsBreakdown,
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

  if (!data || data.totalResponses === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ThumbsUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Aucune r\u00e9ponse de satisfaction</p>
        <p className="text-sm mt-1">
          Les r\u00e9ponses aux enqu\u00eates NPS et CSAT appara\u00eetront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <Users className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{data.totalResponses}</p>
          <p className="text-sm text-muted-foreground">R\u00e9ponses totales</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto text-emerald-600 mb-2" />
          <p className="text-2xl font-bold">{data.npsScore}</p>
          <p className="text-sm text-muted-foreground">Score NPS</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <ThumbsUp className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{data.csatAvg}/5</p>
          <p className="text-sm text-muted-foreground">CSAT moyen</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <MessageSquare className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
          <p className="text-2xl font-bold">{data.responseRate}%</p>
          <p className="text-sm text-muted-foreground">Taux de r\u00e9ponse</p>
        </div>
      </div>

      {/* NPS Breakdown bar */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">R\u00e9partition NPS</h4>
        <div className="flex h-4 rounded-full overflow-hidden">
          {data.npsBreakdown.promotersPct > 0 && (
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${data.npsBreakdown.promotersPct}%` }}
            />
          )}
          {data.npsBreakdown.passivesPct > 0 && (
            <div
              className="bg-amber-400 transition-all"
              style={{ width: `${data.npsBreakdown.passivesPct}%` }}
            />
          )}
          {data.npsBreakdown.detractorsPct > 0 && (
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${data.npsBreakdown.detractorsPct}%` }}
            />
          )}
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span className="text-emerald-600">
            Promoteurs: {data.npsBreakdown.promoters} ({data.npsBreakdown.promotersPct}%)
          </span>
          <span className="text-amber-600">
            Passifs: {data.npsBreakdown.passives} ({data.npsBreakdown.passivesPct}%)
          </span>
          <span className="text-red-600">
            D\u00e9tracteurs: {data.npsBreakdown.detractors} ({data.npsBreakdown.detractorsPct}%)
          </span>
        </div>
      </div>

      {/* NPS Trend line chart */}
      {data.trendData.length > 1 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            \u00c9volution du NPS
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                domain={[-100, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value}`, 'NPS']}
              />
              <Line
                type="monotone"
                dataKey="nps"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Score distribution bar chart */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          Distribution des scores
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.distributionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="score"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value}`, 'R\u00e9ponses']}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
