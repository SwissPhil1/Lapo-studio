import { useTranslation } from 'react-i18next';
import type { ReportConfig, ReportDataPoint } from '@/shared/types/reports';
import { REPORT_SOURCES } from '@/shared/lib/reportSources';
import { getLocale } from '@/shared/lib/format';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ReportChartProps {
  config: ReportConfig;
  data: ReportDataPoint[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const PIE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export function ReportChart({ config, data }: ReportChartProps) {
  const { t } = useTranslation(['reports']);
  const locale = getLocale();
  const sourceDef = REPORT_SOURCES[config.source];

  const getMetricLabel = (key: string) => {
    return sourceDef.metrics.find(m => m.key === key)?.label || key;
  };

  const formatValue = (value: number, metricKey: string) => {
    const metric = sourceDef.metrics.find(m => m.key === metricKey);
    if (metric?.key === 'revenue' || metric?.key === 'avg_value') {
      return `${value.toLocaleString(locale)} CHF`;
    }
    return value.toLocaleString(locale);
  };

  if (data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        {t('reports:noDataAvailable')}
      </div>
    );
  }

  // Table view
  if (config.chartType === 'table') {
    return (
      <div className="overflow-auto max-h-[500px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('reports:dimension')}</TableHead>
              {config.metrics.map(metric => (
                <TableHead key={metric} className="text-right">
                  {getMetricLabel(metric)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{row.label}</TableCell>
                {config.metrics.map(metric => (
                  <TableCell key={metric} className="text-right">
                    {formatValue(row[metric] as number, metric)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Pie chart
  if (config.chartType === 'pie') {
    const primaryMetric = config.metrics[0];
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            dataKey={primaryMetric}
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={150}
            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any) => formatValue(value, primaryMetric)}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // Bar / Line / Area charts
  const ChartComponent = config.chartType === 'line'
    ? LineChart
    : config.chartType === 'area'
      ? AreaChart
      : BarChart;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ChartComponent data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
          className="fill-muted-foreground"
        />
        <YAxis className="fill-muted-foreground" tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: any, name: any) => [
            formatValue(value, name),
            getMetricLabel(name),
          ]}
        />
        <Legend />
        {config.metrics.map((metric, idx) => {
          if (config.chartType === 'line') {
            return (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                name={getMetricLabel(metric)}
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            );
          }
          if (config.chartType === 'area') {
            return (
              <Area
                key={metric}
                type="monotone"
                dataKey={metric}
                name={getMetricLabel(metric)}
                stroke={COLORS[idx % COLORS.length]}
                fill={COLORS[idx % COLORS.length]}
                fillOpacity={0.3}
              />
            );
          }
          return (
            <Bar
              key={metric}
              dataKey={metric}
              name={getMetricLabel(metric)}
              fill={COLORS[idx % COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          );
        })}
      </ChartComponent>
    </ResponsiveContainer>
  );
}
