import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared/lib/supabase';
import { Mail, CheckCheck, Eye, MousePointer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function CommunicationMetrics() {
  const { t } = useTranslation(['communications']);

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['communication-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_communication_logs')
        .select('id, status, channel, delivered_at, opened_count, clicked_count, bounced_at')
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
      label: t('communications:emailsSent'),
      value: metrics?.total || 0,
      icon: Mail,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: t('communications:deliveryRate'),
      value: `${metrics?.deliveryRate || 0}%`,
      icon: CheckCheck,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: t('communications:openRate'),
      value: `${metrics?.openRate || 0}%`,
      icon: Eye,
      color: 'text-accent-foreground',
      bg: 'bg-accent',
    },
    {
      label: t('communications:clickRate'),
      value: `${metrics?.clickRate || 0}%`,
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
