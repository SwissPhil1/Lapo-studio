import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Loader2 } from 'lucide-react';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function PipelineFunnel() {
  const { data: funnelData, isLoading } = useQuery({
    queryKey: ['pipeline-funnel'],
    queryFn: async () => {
      // Fetch pipeline stages with patient counts
      const { data: stages } = await supabase
        .from('pipeline_stages')
        .select('id, name, color, order_index')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      
      if (!stages || stages.length === 0) {
        return [];
      }
      
      // Count patients in each stage
      const { data: pipelinePatients } = await supabase
        .from('pipeline_patients')
        .select('stage_id');
      
      const stageCounts: Record<string, number> = {};
      pipelinePatients?.forEach(pp => {
        stageCounts[pp.stage_id] = (stageCounts[pp.stage_id] || 0) + 1;
      });
      
      return stages.map((stage, index) => ({
        name: stage.name,
        count: stageCounts[stage.id] || 0,
        color: stage.color || COLORS[index % COLORS.length],
      }));
    },
  });
  
  if (isLoading) {
    return (
      <div className="h-[250px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!funnelData || funnelData.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>Aucun stage de pipeline configuré</p>
          <p className="text-sm mt-1">Configurez votre pipeline dans les paramètres</p>
        </div>
      </div>
    );
  }
  
  const totalPatients = funnelData.reduce((sum, stage) => sum + stage.count, 0);
  
  return (
    <div className="space-y-4">
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={funnelData} layout="vertical" margin={{ left: 0, right: 20 }}>
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis 
              type="category" 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              width={100}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: any) => [value, 'Patients']}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Conversion rates */}
      <div className="flex flex-wrap gap-4 text-sm">
        {funnelData.map((stage, index) => {
          const percentage = totalPatients > 0 ? ((stage.count / totalPatients) * 100).toFixed(0) : 0;
          return (
            <div key={stage.name} className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: stage.color || COLORS[index % COLORS.length] }}
              />
              <span className="text-muted-foreground">{stage.name}:</span>
              <span className="font-medium text-foreground">{stage.count}</span>
              <span className="text-muted-foreground">({percentage}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
