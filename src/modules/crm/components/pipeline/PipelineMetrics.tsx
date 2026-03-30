import { useTranslation } from 'react-i18next';
import { Users, Clock, Target, AlertTriangle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface PipelineMetricsProps {
  totalPatients: number;
  avgDaysToComplete: number | null;
  conversionRate: number | null;
  staleLeadsCount: number;
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  variant?: 'default' | 'warning';
}

function MetricCard({ icon: Icon, label, value, subtext, variant = 'default' }: MetricCardProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-lg">
      <div className={cn(
        'p-2 rounded-lg',
        variant === 'warning' ? 'bg-warning/10' : 'bg-primary/10'
      )}>
        <Icon className={cn(
          'h-4 w-4',
          variant === 'warning' ? 'text-warning' : 'text-primary'
        )} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground">
          {value}
          {subtext && <span className="text-sm font-normal text-muted-foreground ml-1">{subtext}</span>}
        </p>
      </div>
    </div>
  );
}

export function PipelineMetrics({
  totalPatients,
  avgDaysToComplete,
  conversionRate,
  staleLeadsCount,
}: PipelineMetricsProps) {
  const { t } = useTranslation(['pipeline']);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard
        icon={Users}
        label={t('pipeline:totalPatients')}
        value={totalPatients}
      />
      <MetricCard
        icon={Clock}
        label={t('pipeline:avgTime')}
        value={avgDaysToComplete !== null ? `${avgDaysToComplete}${t('pipeline:daysUnit')}` : '—'}
        subtext={avgDaysToComplete !== null ? t('pipeline:toComplete') : ''}
      />
      <MetricCard
        icon={Target}
        label={t('pipeline:conversionRate')}
        value={conversionRate !== null ? `${conversionRate}%` : '—'}
      />
      <MetricCard
        icon={AlertTriangle}
        label={t('pipeline:staleLeads')}
        value={staleLeadsCount}
        subtext={t('pipeline:moreThan7Days')}
        variant={staleLeadsCount > 0 ? 'warning' : 'default'}
      />
    </div>
  );
}
