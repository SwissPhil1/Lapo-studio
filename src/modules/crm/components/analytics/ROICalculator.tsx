// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2, DollarSign, Target, TrendingUp, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AdSpend {
  id: string;
  utm_source: string;
  utm_campaign: string | null;
  spend_amount: number;
  currency: string;
  spend_date: string;
}

interface Lead {
  id: string;
  utm_source: string | null;
  utm_campaign: string | null;
  status: string;
}

export function ROICalculator() {
  const { data, isLoading } = useQuery({
    queryKey: ['roi-calculator'],
    queryFn: async () => {
      // Fetch ad spend data
      const { data: adSpend, error: spendError } = await supabase
        .from('crm_ad_spend')
        .select('id, utm_source, utm_campaign, spend_amount, currency, spend_date');

      if (spendError) throw spendError;
      const typedSpend = (adSpend || []) as AdSpend[];

      // Fetch leads with utm data
      const { data: leads, error: leadsError } = await supabase
        .from('crm_leads')
        .select('id, utm_source, utm_campaign, status');

      if (leadsError) throw leadsError;
      const typedLeads = (leads || []) as Lead[];

      // Group by source/channel
      const channelMap = new Map<
        string,
        { spend: number; leads: number; conversions: number }
      >();

      // Accumulate spend by source
      typedSpend.forEach((s) => {
        const source = s.utm_source || 'direct';
        const existing = channelMap.get(source) || { spend: 0, leads: 0, conversions: 0 };
        existing.spend += s.spend_amount;
        channelMap.set(source, existing);
      });

      // Accumulate leads and conversions by source
      typedLeads.forEach((l) => {
        const source = l.utm_source || 'direct';
        const existing = channelMap.get(source) || { spend: 0, leads: 0, conversions: 0 };
        existing.leads++;
        if (l.status === 'converted') existing.conversions++;
        channelMap.set(source, existing);
      });

      const channelData = Array.from(channelMap.entries())
        .map(([source, d]) => {
          const costPerLead = d.leads > 0 ? d.spend / d.leads : 0;
          const costPerAcquisition = d.conversions > 0 ? d.spend / d.conversions : 0;
          // ROAS: assume average revenue per conversion
          // We estimate based on conversions vs spend
          const estimatedRevenue = d.conversions * 500; // Fallback avg revenue per conversion
          const roas = d.spend > 0 ? estimatedRevenue / d.spend : 0;

          return {
            source,
            spend: d.spend,
            leads: d.leads,
            costPerLead: Math.round(costPerLead),
            conversions: d.conversions,
            costPerAcquisition: Math.round(costPerAcquisition),
            roas: parseFloat(roas.toFixed(2)),
          };
        })
        .filter((c) => c.spend > 0 || c.leads > 0)
        .sort((a, b) => b.spend - a.spend);

      // KPIs
      const totalSpend = channelData.reduce((sum, c) => sum + c.spend, 0);
      const totalLeads = channelData.reduce((sum, c) => sum + c.leads, 0);
      const totalConversions = channelData.reduce((sum, c) => sum + c.conversions, 0);
      const avgCostPerLead = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0;
      const avgCostPerAcquisition = totalConversions > 0 ? Math.round(totalSpend / totalConversions) : 0;
      const totalEstRevenue = totalConversions * 500;
      const overallRoas = totalSpend > 0 ? parseFloat((totalEstRevenue / totalSpend).toFixed(2)) : 0;

      // Chart data (top 8 channels)
      const chartData = channelData.slice(0, 8).map((c) => ({
        source: c.source.length > 15 ? c.source.substring(0, 15) + '...' : c.source,
        'Co\u00fbt/Lead': c.costPerLead,
        "Co\u00fbt/Acquisition": c.costPerAcquisition,
      }));

      return {
        channelData,
        chartData,
        totalSpend,
        totalLeads,
        totalConversions,
        avgCostPerLead,
        avgCostPerAcquisition,
        overallRoas,
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

  if (!data || data.channelData.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Aucune donn\u00e9e de d\u00e9penses publicitaires</p>
        <p className="text-sm mt-1">
          Connectez vos comptes publicitaires pour voir le ROI par canal.
        </p>
      </div>
    );
  }

  const formatCHF = (value: number) =>
    new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <DollarSign className="h-5 w-5 mx-auto text-destructive mb-2" />
          <p className="text-2xl font-bold">{formatCHF(data.avgCostPerLead)}</p>
          <p className="text-sm text-muted-foreground">Co\u00fbt / Lead</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <Target className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{formatCHF(data.avgCostPerAcquisition)}</p>
          <p className="text-sm text-muted-foreground">Co\u00fbt / Acquisition</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto text-emerald-600 mb-2" />
          <p className="text-2xl font-bold">{data.overallRoas}x</p>
          <p className="text-sm text-muted-foreground">ROAS global</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <Users className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{data.totalConversions}</p>
          <p className="text-sm text-muted-foreground">Conversions</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">D\u00e9penses</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">Co\u00fbt/Lead</TableHead>
              <TableHead className="text-right">Conversions</TableHead>
              <TableHead className="text-right">Co\u00fbt/Acq.</TableHead>
              <TableHead className="text-right">ROAS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.channelData.map((channel) => (
              <TableRow key={channel.source}>
                <TableCell className="font-medium">{channel.source}</TableCell>
                <TableCell className="text-right">{formatCHF(channel.spend)}</TableCell>
                <TableCell className="text-right">{channel.leads}</TableCell>
                <TableCell className="text-right">
                  {channel.costPerLead > 0 ? formatCHF(channel.costPerLead) : '-'}
                </TableCell>
                <TableCell className="text-right">{channel.conversions}</TableCell>
                <TableCell className="text-right">
                  {channel.costPerAcquisition > 0 ? formatCHF(channel.costPerAcquisition) : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={
                      channel.roas >= 1
                        ? 'text-emerald-600 font-medium'
                        : 'text-red-600 font-medium'
                    }
                  >
                    {channel.roas > 0 ? `${channel.roas}x` : '-'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Bar chart */}
      {data.chartData.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Comparaison des co\u00fbts par canal
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="source"
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
                formatter={(value: number, name: string) => [formatCHF(value), name]}
              />
              <Legend />
              <Bar dataKey="Co\u00fbt/Lead" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Co\u00fbt/Acquisition" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
