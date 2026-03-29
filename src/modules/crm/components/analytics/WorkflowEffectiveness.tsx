// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, Zap, CheckCircle, Clock, XCircle } from 'lucide-react';
import { differenceInDays } from 'date-fns';

interface WorkflowEffectivenessProps {
  dateRange: string;
}

export function WorkflowEffectiveness({ dateRange }: WorkflowEffectivenessProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['workflow-effectiveness', dateRange],
    queryFn: async () => {
      const { data: enrollments, error } = await supabase
        .from('crm_workflow_enrollments')
        .select(`
          id,
          status,
          current_step,
          enrolled_at,
          completed_at,
          workflow:workflow_id (
            id,
            name
          )
        `);

      if (error) throw error;

      const total = enrollments?.length || 0;
      const completed = enrollments?.filter(e => e.status === 'completed') || [];
      const active = enrollments?.filter(e => e.status === 'active') || [];
      const paused = enrollments?.filter(e => e.status === 'paused') || [];

      // Status breakdown for pie chart
      const statusData = [
        { name: 'Terminés', value: completed.length, color: 'hsl(152, 69%, 40%)' },
        { name: 'En cours', value: active.length, color: 'hsl(173, 58%, 39%)' },
        { name: 'En pause', value: paused.length, color: 'hsl(38, 92%, 50%)' },
      ].filter(d => d.value > 0);

      // Average completion time
      const completionTimes = completed
        .filter(e => e.enrolled_at && e.completed_at)
        .map(e => differenceInDays(new Date(e.completed_at!), new Date(e.enrolled_at)));
      
      const avgCompletionDays = completionTimes.length > 0 
        ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
        : 0;

      // By workflow performance
      const workflowMap = new Map<string, { name: string; total: number; completed: number }>();
      enrollments?.forEach((e: any) => {
        const wfId = e.workflow?.id || 'unknown';
        const wfName = e.workflow?.name || 'Inconnu';
        
        if (!workflowMap.has(wfId)) {
          workflowMap.set(wfId, { name: wfName, total: 0, completed: 0 });
        }
        
        const wf = workflowMap.get(wfId)!;
        wf.total++;
        if (e.status === 'completed') {
          wf.completed++;
        }
      });

      const workflowData = Array.from(workflowMap.values())
        .map(wf => ({
          ...wf,
          rate: wf.total > 0 ? Math.round((wf.completed / wf.total) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      return {
        total,
        completedCount: completed.length,
        activeCount: active.length,
        completionRate: total > 0 ? Math.round((completed.length / total) * 100) : 0,
        avgCompletionDays,
        statusData,
        workflowData,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Aucun workflow actif
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <Zap className="h-4 w-4 mx-auto text-primary mb-1" />
          <p className="text-xl font-bold text-foreground">{data.total}</p>
          <p className="text-xs text-muted-foreground">Total inscrits</p>
        </div>
        <div className="bg-success/10 rounded-lg p-3 text-center">
          <CheckCircle className="h-4 w-4 mx-auto text-success mb-1" />
          <p className="text-xl font-bold text-foreground">{data.completionRate}%</p>
          <p className="text-xs text-muted-foreground">Taux complétion</p>
        </div>
        <div className="bg-primary/10 rounded-lg p-3 text-center">
          <Clock className="h-4 w-4 mx-auto text-primary mb-1" />
          <p className="text-xl font-bold text-foreground">{data.activeCount}</p>
          <p className="text-xs text-muted-foreground">En cours</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-xl font-bold text-foreground">{data.avgCompletionDays}j</p>
          <p className="text-xs text-muted-foreground">Durée moyenne</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Status Pie */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Répartition par statut</h4>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={data.statusData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                dataKey="value"
                nameKey="name"
              >
                {data.statusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs">
            {data.statusData.map((d, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Workflow */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Par workflow</h4>
          {data.workflowData.length > 0 ? (
            <div className="space-y-2">
              {data.workflowData.map((wf, i) => (
                <div key={i} className="bg-secondary/30 rounded-lg px-3 py-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-foreground truncate">{wf.name}</span>
                    <span className="text-xs text-muted-foreground">{wf.rate}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${wf.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun workflow</p>
          )}
        </div>
      </div>
    </div>
  );
}
