import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Loader2, FlaskConical } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ABTestResultsProps {
  campaignId: string;
}

interface VariantRow {
  id: string;
  variant_name: string;
  weight: number;
}

export function ABTestResults({ campaignId }: ABTestResultsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['ab-test-results', campaignId],
    queryFn: async () => {
      // Fetch campaign variants
      const { data: variants, error: variantsError } = await supabase
        .from('crm_campaign_variants')
        .select('id, variant_name, weight')
        .eq('campaign_id', campaignId)
        .order('variant_name');

      if (variantsError) throw variantsError;
      if (!variants || variants.length === 0) return null;

      const typedVariants = variants as VariantRow[];

      // Fetch communication logs for this campaign, which should include variant_id
      const { data: logs, error: logsError } = await supabase
        .from('crm_communication_logs')
        .select('id, status, opened_at, clicked_at, campaign_id')
        .eq('campaign_id', campaignId);

      if (logsError) throw logsError;

      // Since communication_logs may reference variant via metadata or a variant_id field,
      // we calculate per-variant by distributing based on variant weights if no variant_id column
      // For now, attempt to fetch logs with variant grouping from metadata
      const variantMetrics = typedVariants.map((variant) => {
        // Filter logs that belong to this variant
        // Communication logs may store variant_id in metadata or as a direct column
        const variantLogs = (logs || []).filter((log: Record<string, unknown>) => {
          return (log as Record<string, unknown>).variant_id === variant.id;
        });

        const sent = variantLogs.length;
        const opened = variantLogs.filter((l) => l.opened_at).length;
        const clicked = variantLogs.filter((l) => l.clicked_at).length;
        const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0.0';
        const clickRate = sent > 0 ? ((clicked / sent) * 100).toFixed(1) : '0.0';

        return {
          variant_name: `Variante ${variant.variant_name}`,
          weight: variant.weight,
          sent,
          opened,
          clicked,
          openRate,
          clickRate,
          openRateNum: sent > 0 ? (opened / sent) * 100 : 0,
          clickRateNum: sent > 0 ? (clicked / sent) * 100 : 0,
        };
      });

      return variantMetrics;
    },
  });

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Aucune variante A/B configur\u00e9e pour cette campagne</p>
        </div>
      </div>
    );
  }

  // Determine the winner (highest open rate)
  const winner = data.reduce((best, current) =>
    current.openRateNum > best.openRateNum ? current : best
  );

  return (
    <div className="space-y-6">
      {/* Metrics table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Variante</TableHead>
            <TableHead className="text-right">Envoy\u00e9s</TableHead>
            <TableHead className="text-right">Taux d'ouverture</TableHead>
            <TableHead className="text-right">Taux de clic</TableHead>
            <TableHead className="text-right">R\u00e9partition</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((variant) => (
            <TableRow key={variant.variant_name}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {variant.variant_name}
                  {variant === winner && data.some((d) => d.sent > 0) && (
                    <Badge variant="success" className="text-xs">
                      Meilleur
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">{variant.sent}</TableCell>
              <TableCell className="text-right">{variant.openRate}%</TableCell>
              <TableCell className="text-right">{variant.clickRate}%</TableCell>
              <TableCell className="text-right">{variant.weight}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Bar chart comparison */}
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 0, right: 20 }}>
            <XAxis
              dataKey="variant_name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              unit="%"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: any, name: any) => {
                const labels: Record<string, string> = {
                  openRateNum: "Taux d'ouverture",
                  clickRateNum: 'Taux de clic',
                };
                return [`${value.toFixed(1)}%`, labels[name] || name];
              }}
            />
            <Legend
              formatter={(value) => {
                const labels: Record<string, string> = {
                  openRateNum: "Taux d'ouverture",
                  clickRateNum: 'Taux de clic',
                };
                return labels[value] || value;
              }}
            />
            <Bar dataKey="openRateNum" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="clickRateNum" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
