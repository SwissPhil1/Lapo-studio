import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, AlertTriangle, Users, TrendingDown, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DrillDownPanel, type DrillDownData } from './DrillDownPanel';

interface AtRiskPatient {
  id: string;
  first_name: string;
  last_name: string;
  churn_risk_score: number;
  last_visit_date: string | null;
}

export function ChurnPrediction() {
  const { t } = useTranslation(['analytics']);
  const navigate = useNavigate();
  const [drillDown, setDrillDown] = useState<DrillDownData | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['churn-prediction'],
    queryFn: async () => {
      // Fetch patients with churn_risk_score
      const { data: patients, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, churn_risk_score, last_visit_date')
        .not('churn_risk_score', 'is', null)
        .order('churn_risk_score', { ascending: false });

      if (error) throw error;

      const typedPatients = (patients || []) as AtRiskPatient[];

      // Risk distribution
      const high = typedPatients.filter((p) => p.churn_risk_score > 70).length;
      const medium = typedPatients.filter(
        (p) => p.churn_risk_score >= 40 && p.churn_risk_score <= 70
      ).length;
      const low = typedPatients.filter((p) => p.churn_risk_score < 40).length;

      const distributionData = [
        { name: '\u00c9lev\u00e9', count: high, color: '#FF6B6B' },
        { name: 'Moyen', count: medium, color: '#F59E0B' },
        { name: 'Faible', count: low, color: '#22C55E' },
      ];

      // Top 10 at-risk
      const topAtRisk = typedPatients.slice(0, 10);

      // KPIs
      const totalAtRisk = typedPatients.length;
      const avgRiskScore =
        totalAtRisk > 0
          ? Math.round(
              typedPatients.reduce((sum, p) => sum + p.churn_risk_score, 0) / totalAtRisk
            )
          : 0;

      // Patients due for reactivation (high risk, last visit > 90 days ago or null)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const dueForReactivation = typedPatients.filter((p) => {
        if (p.churn_risk_score < 40) return false;
        if (!p.last_visit_date) return true;
        return new Date(p.last_visit_date) < ninetyDaysAgo;
      }).length;

      // Group patients by risk level for drill-down
      const patientsByRisk: Record<string, AtRiskPatient[]> = {
        '\u00c9lev\u00e9': typedPatients.filter(p => p.churn_risk_score > 70),
        'Moyen': typedPatients.filter(p => p.churn_risk_score >= 40 && p.churn_risk_score <= 70),
        'Faible': typedPatients.filter(p => p.churn_risk_score < 40),
      };

      return {
        distributionData,
        topAtRisk,
        totalAtRisk,
        avgRiskScore,
        dueForReactivation,
        patientsByRisk,
      };
    },
  });

  const handleSegmentClick = useCallback((entry: any) => {
    if (!data || !entry) return;
    const segmentName = entry.name;
    const patients = data.patientsByRisk[segmentName] || [];
    setDrillDown({
      title: t('analytics:drillDown.churnTitle'),
      subtitle: `${segmentName} (${patients.length} patients)`,
      columns: [
        { key: 'name', label: t('analytics:drillDown.colPatient') },
        { key: 'score', label: t('analytics:drillDown.colRiskScore') },
        { key: 'lastVisit', label: t('analytics:drillDown.colLastVisit') },
      ],
      rows: patients.map(p => ({
        name: `${p.first_name} ${p.last_name}`,
        score: p.churn_risk_score,
        lastVisit: p.last_visit_date
          ? format(new Date(p.last_visit_date), 'dd/MM/yyyy')
          : '-',
      })),
    });
  }, [data, t]);

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
        <p className="font-medium">Aucune donn\u00e9e de pr\u00e9diction de churn</p>
        <p className="text-sm mt-1">
          Les scores de risque de churn appara\u00eetront ici lorsqu'ils seront calcul\u00e9s.
        </p>
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
          <p className="text-sm text-muted-foreground">Total \u00e0 risque</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <TrendingDown className="h-5 w-5 mx-auto text-warning mb-2" />
          <p className="text-2xl font-bold">{data.avgRiskScore}</p>
          <p className="text-sm text-muted-foreground">Score moyen</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <RefreshCw className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{data.dueForReactivation}</p>
          <p className="text-sm text-muted-foreground">\u00c0 r\u00e9activer</p>
        </div>
      </div>

      {/* Risk distribution chart */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          R\u00e9partition du risque de churn
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
              formatter={(value: any) => [`${value}`, 'Patients']}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(entry: any) => handleSegmentClick(entry)}>
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
          Top 10 patients \u00e0 risque
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
                      ? `Derni\u00e8re visite: ${format(new Date(patient.last_visit_date), 'dd MMM yyyy', { locale: fr })}`
                      : 'Aucune visite enregistr\u00e9e'}
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

      <DrillDownPanel data={drillDown} onClose={() => setDrillDown(null)} />
    </div>
  );
}
