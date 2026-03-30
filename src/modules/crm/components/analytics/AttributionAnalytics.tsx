import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, TrendingUp, MousePointerClick, Users, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AttributionAnalyticsProps {
  dateRange: string;
}

const COLORS = ['#7C3AED', '#14b8a6', '#06B6D4', '#5eead4', '#99f6e4', '#ccfbf1', '#f0fdfa'];

export function AttributionAnalytics({ dateRange }: AttributionAnalyticsProps) {
  const { t } = useTranslation(['analytics']);
  const { data, isLoading } = useQuery({
    queryKey: ['attribution-analytics', dateRange],
    queryFn: async () => {
      // Get leads with UTM data
      const { data: leads, error: leadsError } = await supabase
        .from('crm_leads')
        .select('id, utm_source, utm_medium, utm_campaign, status, created_at');

      if (leadsError) throw leadsError;

      // Get patients with lead source
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id, utm_source, utm_medium, utm_campaign, lead_source, created_at')
        .not('utm_source', 'is', null);

      if (patientsError) throw patientsError;

      // Source breakdown
      const sourceMap = new Map<string, { leads: number; converted: number }>();
      (leads || []).forEach((lead) => {
        const source = lead.utm_source || 'direct';
        const existing = sourceMap.get(source) || { leads: 0, converted: 0 };
        existing.leads++;
        if (lead.status === 'converted') existing.converted++;
        sourceMap.set(source, existing);
      });

      const bySource = Array.from(sourceMap.entries())
        .map(([source, data]) => ({
          source,
          leads: data.leads,
          converted: data.converted,
          rate: data.leads > 0 ? Math.round((data.converted / data.leads) * 100) : 0,
        }))
        .sort((a, b) => b.leads - a.leads)
        .slice(0, 10);

      // Medium breakdown
      const mediumMap = new Map<string, number>();
      (leads || []).forEach((lead) => {
        const medium = lead.utm_medium || 'none';
        mediumMap.set(medium, (mediumMap.get(medium) || 0) + 1);
      });

      const byMedium = Array.from(mediumMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 7);

      // Campaign breakdown
      const campaignMap = new Map<string, { leads: number; converted: number }>();
      (leads || []).forEach((lead) => {
        if (!lead.utm_campaign) return;
        const existing = campaignMap.get(lead.utm_campaign) || { leads: 0, converted: 0 };
        existing.leads++;
        if (lead.status === 'converted') existing.converted++;
        campaignMap.set(lead.utm_campaign, existing);
      });

      const byCampaign = Array.from(campaignMap.entries())
        .map(([campaign, data]) => ({
          campaign,
          leads: data.leads,
          converted: data.converted,
          rate: data.leads > 0 ? Math.round((data.converted / data.leads) * 100) : 0,
        }))
        .sort((a, b) => b.leads - a.leads)
        .slice(0, 10);

      // KPIs
      const totalLeads = leads?.length || 0;
      const convertedLeads = leads?.filter((l) => l.status === 'converted').length || 0;
      const overallRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
      const trackedPatients = patients?.length || 0;

      return { bySource, byMedium, byCampaign, totalLeads, convertedLeads, overallRate, trackedPatients };
    },
  });

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.totalLeads === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MousePointerClick className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">{t('analytics:noAttributionData')}</p>
        <p className="text-sm mt-1">{t('analytics:attributionEmptyDescription')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <Users className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{data.totalLeads}</p>
          <p className="text-sm text-muted-foreground">Total leads</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <Target className="h-5 w-5 mx-auto text-success mb-2" />
          <p className="text-2xl font-bold">{data.convertedLeads}</p>
          <p className="text-sm text-muted-foreground">Convertis</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{data.overallRate}%</p>
          <p className="text-sm text-muted-foreground">Taux conversion</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <MousePointerClick className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{data.trackedPatients}</p>
          <p className="text-sm text-muted-foreground">Patients trackés</p>
        </div>
      </div>

      {/* Source bar chart */}
      {data.bySource.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Leads par source</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.bySource}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="source" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="leads" fill="#7C3AED" name="Leads" radius={[4, 4, 0, 0]} />
              <Bar dataKey="converted" fill="#06B6D4" name="Convertis" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Medium pie chart */}
      {data.byMedium.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Répartition par canal</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.byMedium} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {data.byMedium.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Campaign table */}
      {data.byCampaign.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Performance par campagne UTM</h4>
          <div className="space-y-2">
            {data.byCampaign.map((c, i) => (
              <div key={i} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                <span className="text-sm font-medium truncate max-w-[200px]">{c.campaign}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{c.leads} leads</span>
                  <span className="text-success">{c.converted} convertis</span>
                  <span className="font-medium">{c.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
