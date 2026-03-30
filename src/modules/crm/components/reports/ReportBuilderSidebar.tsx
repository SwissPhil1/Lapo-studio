import type { ReportConfig, ReportSource, ChartType, RelativePeriod } from '@/shared/types/reports';
import { REPORT_SOURCES, CHART_TYPES, RELATIVE_PERIODS } from '@/shared/lib/reportSources';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { BarChart3, LineChart, AreaChart, PieChart, Table } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';

interface ReportBuilderSidebarProps {
  config: ReportConfig;
  onChange: (config: ReportConfig) => void;
}

const chartIcons: Record<string, React.ElementType> = {
  bar: BarChart3,
  line: LineChart,
  area: AreaChart,
  pie: PieChart,
  table: Table,
};

export function ReportBuilderSidebar({ config, onChange }: ReportBuilderSidebarProps) {
  const { t } = useTranslation(['reports']);
  const sourceDef = REPORT_SOURCES[config.source];

  const handleSourceChange = (source: ReportSource) => {
    const newSourceDef = REPORT_SOURCES[source];
    onChange({
      ...config,
      source,
      metrics: [newSourceDef.metrics[0]?.key || ''],
      dimension: newSourceDef.dimensions[0]?.key || '',
      filters: [],
    });
  };

  const handleMetricToggle = (metricKey: string) => {
    const newMetrics = config.metrics.includes(metricKey)
      ? config.metrics.filter(m => m !== metricKey)
      : [...config.metrics, metricKey].slice(0, 3); // Max 3 metrics
    
    if (newMetrics.length > 0) {
      onChange({ ...config, metrics: newMetrics });
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Source */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('reports:dataSource')}</Label>
          <Select value={config.source} onValueChange={(v) => handleSourceChange(v as ReportSource)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REPORT_SOURCES).map(([key, def]) => (
                <SelectItem key={key} value={key}>{def.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Metrics */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('reports:metricsMax3')}</Label>
          <div className="space-y-2">
            {sourceDef.metrics.map((metric) => (
              <div key={metric.key} className="flex items-center space-x-2">
                <Checkbox
                  id={`metric-${metric.key}`}
                  checked={config.metrics.includes(metric.key)}
                  onCheckedChange={() => handleMetricToggle(metric.key)}
                  disabled={!config.metrics.includes(metric.key) && config.metrics.length >= 3}
                />
                <label
                  htmlFor={`metric-${metric.key}`}
                  className="text-sm cursor-pointer"
                >
                  {metric.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Dimension */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Grouper par</Label>
          <Select 
            value={config.dimension} 
            onValueChange={(v) => onChange({ ...config, dimension: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sourceDef.dimensions.map((dim) => (
                <SelectItem key={dim.key} value={dim.key}>{dim.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Période</Label>
          <RadioGroup
            value={config.dateRange.value || '30d'}
            onValueChange={(v) => onChange({
              ...config,
              dateRange: { type: 'relative', value: v as RelativePeriod },
            })}
          >
            {RELATIVE_PERIODS.map((period) => (
              <div key={period.value} className="flex items-center space-x-2">
                <RadioGroupItem value={period.value} id={`period-${period.value}`} />
                <label htmlFor={`period-${period.value}`} className="text-sm cursor-pointer">
                  {period.label}
                </label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Chart Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Type de graphique</Label>
          <ToggleGroup
            type="single"
            value={config.chartType}
            onValueChange={(v) => v && onChange({ ...config, chartType: v as ChartType })}
            className="flex flex-wrap gap-1"
          >
            {CHART_TYPES.map((type) => {
              const Icon = chartIcons[type.key];
              return (
                <ToggleGroupItem
                  key={type.key}
                  value={type.key}
                  aria-label={type.label}
                  className="flex-1 min-w-[60px]"
                >
                  <Icon className="h-4 w-4" />
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
          <p className="text-xs text-muted-foreground">
            {CHART_TYPES.find(t => t.key === config.chartType)?.label}
          </p>
        </div>
      </div>
    </ScrollArea>
  );
}
