import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { Mail, CheckCheck, Eye, MousePointer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function CommunicationMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['communication-metrics'],
    queryFn: async () => {
      // Get stats for last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('crm_communication_logs')
        .select('id, status, channel, delivered_at, opened_count, clicked_count, bounced_at')
        .gte('sent_at', sevenDaysAgo.toISOString())
        .eq('channel', 'email');
      
      if (error) throw error;
      
      const total = data.length;
      const delivered = data.filter(d => d.delivered_at).length;
      const opened = data.filter(d => (d.opened_count || 0) > 0).length;
      const clicked = data.filter(d => (d.clicked_count || 0) > 0).length;
      
      return {
        total,
        deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
        openRate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
        clickRate: opened > 0 ? Math.round((clicked / opened) * 100) : 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Emails envoyés',
      value: metrics?.total || 0,
      subLabel: '7 derniers jours',
      icon: Mail,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Taux de livraison',
      value: `${metrics?.deliveryRate || 0}%`,
      subLabel: 'Délivrés',
      icon: CheckCheck,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: "Taux d'ouverture",
      value: `${metrics?.openRate || 0}%`,
      subLabel: 'Ouverts',
      icon: Eye,
      color: 'text-accent-foreground',
      bg: 'bg-accent',
    },
    {
      label: 'Taux de clics',
      value: `${metrics?.clickRate || 0}%`,
      subLabel: 'Cliqués',
      icon: MousePointer,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="card-elevated p-4 flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.bg}`}>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
