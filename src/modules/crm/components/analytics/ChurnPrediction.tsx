import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, AlertTriangle, Users, TrendingDown, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';

interface AtRiskPatient {
  id: string;
  first_name: string;
  last_name: string;
  churn_risk_score: number;
  last_visit_date: string | null;
}

export function ChurnPrediction() {
  const { t, i18n } = useTranslation(['analytics']);
  const navigate = useNavigate();
  const dateLocale = i18n.language === 'fr' ? frLocale : enUS;

  const { data, isLoading } = useQuery({
    queryKey: ['churn-prediction'],
    queryFn: async () => {
      const { data: patients, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, churn_risk_score, last_visit_date')
        .not('churn_risk_score', 'is', null)
        .order('churn_risk_score', { ascending: false });

      if (error) throw error;

      const typedPatients = (patients || []) as AtRiskPatient[];

      const high = typedPatients.filter((p) => p.churn_risk_score > 70).length;
      const medium = typedPatients.filter(
        (p) => p.churn_risk_score >= 40 && p.churn_risk_score <= 70
      ).length;
      const low = typedPatients.filter((p) => p.churn_risk_score < 40).length;

      const distributionData = [
        { name: t('analytics:riskHigh'), count: high, color: '#FF6B6B' },
        { name: t('analytics:riskMedium'), count: medium, color: '#F59E0B' },
        { name: t('analytics:riskLow'), count: low, color: '#22C55E' },
      ];

      const topAtRisk = typedPatients.slice(0, 10);

      const totalAtRisk = typedPatients.length;
      const avgRiskScore =
        totalAtRisk > 0
          ? Math.round(
              typedPatients.reduce((sum, p) => sum + p.churn_risk_score, 0) / totalAtRisk
            )
          : 0;

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const dueForReactivation = typedPatients.filter((p) => {
        if (p.churn_risk_score < 40) return false;
        if (!p.last_visit_date) return true;
        return new Date(p.last_visit_date) < ninetyDaysAgo;
      }).length;

      return {
        distributionData,
        topAtRisk,
        totalAtRisk,
        avgRiskScore,
        dueForReactivation,
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

  if (!data || data.totalAtRisk === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">{t('analytics:noChurnData')}</p>
        <p className="text-sm mt-1">{t('analytics:noChurnDataDescription')}</p>
      </div>
    );
  }

  const getRiskBadgeClass = (score: number) => {
    if (score > 70) return 'bg-destructive/15 text-destructive';
    if (score >= 40) return 'bg-warning/15 text-warning';
    return 'bg-success/15 text-success';
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <Users className="h-5 w-5 mx-auto text-destructive mb-2" />
          <p className="text-2xl font-bold">{data.totalAtRisk}</p>
          <p className="text-sm text-muted-foreground">{t('analytics:totalAtRisk')}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <TrendingDown className="h-5 w-5 mx-auto text-warning mb-2" />
          <p className="text-2xl font-bold">{data.avgRiskScore}</p>
          <p className="text-sm text-muted-foreground">{t('analytics:avgScore')}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <RefreshCw className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{data.dueForReactivation}</p>
          <p className="text-sm text-muted-foreground">{t('analytics:toReactivate')}</p>
        </div>
      </div>

      {/* Risk distribution chart */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          {t('analytics:churnRiskDistribution')}
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.distributionData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: any) => [`${value}`, t('analytics:patients')]}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.distributionData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top 10 at-risk patients */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          {t('analytics:top10AtRisk')}
        </h4>
        <div className="space-y-2">
          {data.topAtRisk.map((patient) => (
            <div
              key={patient.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/crm/patients/${patient.id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-accent-foreground">
                    {patient.first_name?.charAt(0)}
                    {patient.last_name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {patient.first_name} {patient.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {patient.last_visit_date
                      ? `${t('analytics:lastVisit')}: ${format(new Date(patient.last_visit_date), 'dd MMM yyyy', { locale: dateLocale })}`
                      : t('analytics:noVisitRecorded')}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getRiskBadgeClass(patient.churn_risk_score)}`}
              >
                {patient.churn_risk_score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
