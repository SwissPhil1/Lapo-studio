import { ReportConfig, ReportDataPoint } from '@/shared/types/reports';
import { REPORT_SOURCES, RELATIVE_PERIODS } from '@/shared/lib/reportSources';
import { ReportChart } from './ReportChart';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';

interface ReportPreviewProps {
  config: ReportConfig;
  data: ReportDataPoint[];
  isLoading: boolean;
}

export function ReportPreview({ config, data, isLoading }: ReportPreviewProps) {
  const sourceDef = REPORT_SOURCES[config.source];
  const periodLabel = RELATIVE_PERIODS.find(p => p.value === config.dateRange.value)?.label || 'Période personnalisée';
  
  const getMetricLabel = (key: string) => {
    return sourceDef.metrics.find(m => m.key === key)?.label || key;
  };

  const handleExportCSV = () => {
    if (data.length === 0) return;

    const headers = ['Dimension', ...config.metrics.map(m => getMetricLabel(m))];
    const rows = data.map(row => [
      row.label,
      ...config.metrics.map(m => row[m]),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {sourceDef.label} • {periodLabel}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Groupé par: {sourceDef.dimensions.find(d => d.key === config.dimension)?.label}
            {' • '}
            Métriques: {config.metrics.map(m => getMetricLabel(m)).join(', ')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={data.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          CSV
        </Button>
      </div>

      {/* Chart */}
      <div className="card-elevated p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-[350px] w-full" />
          </div>
        ) : (
          <ReportChart config={config} data={data} />
        )}
      </div>

      {/* Summary */}
      {!isLoading && data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {config.metrics.map(metricKey => {
            const total = data.reduce((sum, row) => sum + (row[metricKey] as number), 0);
            const avg = total / data.length;
            const metric = sourceDef.metrics.find(m => m.key === metricKey);
            
            return (
              <div key={metricKey} className="card-elevated p-4">
                <p className="text-sm text-muted-foreground">{getMetricLabel(metricKey)}</p>
                <p className="text-xl font-bold">
                  {metric?.key === 'revenue' || metric?.key === 'avg_value'
                    ? `${Math.round(total).toLocaleString('fr-CH')} CHF`
                    : Math.round(total).toLocaleString('fr-CH')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Moy: {Math.round(avg).toLocaleString('fr-CH')}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
