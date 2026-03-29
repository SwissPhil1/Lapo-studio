import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, Mail, MousePointer, AlertTriangle, CheckCircle } from 'lucide-react';

interface CommunicationEffectivenessProps {
  dateRange: string;
}

export function CommunicationEffectiveness({ dateRange }: CommunicationEffectivenessProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['communication-effectiveness', dateRange],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from('crm_communication_logs')
        .select('id, status, opened_at, clicked_at, bounced_at, delivered_at, channel, sent_at')
        .eq('channel', 'email');

      if (error) throw error;

      const total = logs?.length || 0;
      const delivered = logs?.filter(l => l.delivered_at).length || 0;
      const opened = logs?.filter(l => l.opened_at).length || 0;
      const clicked = logs?.filter(l => l.clicked_at).length || 0;
      const bounced = logs?.filter(l => l.bounced_at).length || 0;

      const metrics = [
        { 
          name: 'Délivrés', 
          value: total > 0 ? Math.round((delivered / total) * 100) : 0,
          count: delivered,
          color: '#7C3AED',
          icon: CheckCircle,
        },
        { 
          name: 'Ouverts', 
          value: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
          count: opened,
          color: '#06B6D4',
          icon: Mail,
        },
        { 
          name: 'Cliqués', 
          value: opened > 0 ? Math.round((clicked / opened) * 100) : 0,
          count: clicked,
          color: '#22C55E',
          icon: MousePointer,
        },
        { 
          name: 'Rebonds', 
          value: total > 0 ? Math.round((bounced / total) * 100) : 0,
          count: bounced,
          color: '#FF6B6B',
          icon: AlertTriangle,
        },
      ];

      // Hour distribution for sent emails
      const hourCounts = new Array(24).fill(0);
      logs?.forEach(log => {
        if (log.sent_at) {
          const hour = new Date(log.sent_at).getHours();
          hourCounts[hour]++;
        }
      });

      const hourData = hourCounts.map((count, hour) => ({
        hour: `${hour}h`,
        count,
      }));

      return { metrics, hourData, total };
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
        Aucun email envoyé
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div key={i} className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4" style={{ color: metric.color }} />
                <span className="text-sm text-muted-foreground">{metric.name}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{metric.value}%</p>
              <p className="text-xs text-muted-foreground">{metric.count} emails</p>
            </div>
          );
        })}
      </div>

      {/* Hour Distribution */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Distribution par heure d'envoi</h4>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data.hourData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="hour" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              interval={2}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="count" fill="#7C3AED" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Total: {data.total} emails analysés
      </p>
    </div>
  );
}
