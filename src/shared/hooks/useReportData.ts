import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { ReportConfig, ReportDataPoint } from '@/shared/types/reports';
import { REPORT_SOURCES } from '@/shared/lib/reportSources';
import { subDays, subMonths, format, startOfMonth, startOfWeek } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import i18n from '@/i18n';

function getDateRange(config: ReportConfig): { start: Date; end: Date } {
  const end = new Date();
  let start: Date;

  if (config.dateRange.type === 'fixed' && config.dateRange.start && config.dateRange.end) {
    return { start: new Date(config.dateRange.start), end: new Date(config.dateRange.end) };
  }

  switch (config.dateRange.value) {
    case '7d':
      start = subDays(end, 7);
      break;
    case '30d':
      start = subDays(end, 30);
      break;
    case '90d':
      start = subDays(end, 90);
      break;
    case '12m':
    default:
      start = subMonths(end, 12);
      break;
  }

  return { start, end };
}

function formatDimensionValue(value: string | null, dimension: string, transform?: string): string {
  if (!value) return i18n.t('common:undefined');

  const dateLocale = i18n.language === 'fr' ? frLocale : enUS;

  if (transform === 'month') {
    try {
      const date = new Date(value);
      return format(startOfMonth(date), 'MMM yyyy', { locale: dateLocale });
    } catch {
      return value;
    }
  }

  if (transform === 'week') {
    try {
      const date = new Date(value);
      return `${i18n.t('common:weekLabel')} ${format(startOfWeek(date, { locale: dateLocale }), 'dd/MM', { locale: dateLocale })}`;
    } catch {
      return value;
    }
  }

  // Format known values
  if (dimension === 'status') {
    const statusLabels: Record<string, string> = {
      scheduled: i18n.t('common:statusScheduled'),
      completed: i18n.t('common:statusCompleted'),
      cancelled: i18n.t('common:statusCancelled'),
      no_show: i18n.t('common:statusNoShow'),
      rescheduled: i18n.t('common:statusRescheduled'),
      pending: i18n.t('common:statusPending'),
      booked: i18n.t('common:statusBooked'),
      confirmed: i18n.t('common:statusConfirmed'),
    };
    return statusLabels[value] || value;
  }

  if (dimension === 'gender') {
    const genderLabels: Record<string, string> = {
      male: i18n.t('common:genderMale'),
      female: i18n.t('common:genderFemale'),
      other: i18n.t('common:genderOther'),
    };
    return genderLabels[value.toLowerCase()] || value;
  }

  if (dimension === 'channel') {
    const channelLabels: Record<string, string> = {
      email: 'Email',
      sms: 'SMS',
      whatsapp: 'WhatsApp',
    };
    return channelLabels[value.toLowerCase()] || value;
  }

  return value;
}

export function useReportData(config: ReportConfig | null) {
  return useQuery({
    queryKey: ['report-data', config],
    queryFn: async (): Promise<ReportDataPoint[]> => {
      if (!config || !config.source || config.metrics.length === 0 || !config.dimension) {
        return [];
      }

      const sourceDef = REPORT_SOURCES[config.source];
      const dimensionDef = sourceDef.dimensions.find(d => d.key === config.dimension);
      if (!dimensionDef) return [];

      const { start, end } = getDateRange(config);
      const startStr = start.toISOString();
      const endStr = end.toISOString();

      // Build the select query
      const selectFields = [dimensionDef.field];
      const metricFields: string[] = [];
      
      config.metrics.forEach(metricKey => {
        const metricDef = sourceDef.metrics.find(m => m.key === metricKey);
        if (metricDef?.field) {
          metricFields.push(metricDef.field);
        }
      });

      // Fetch raw data
      let query = supabase
        .from(sourceDef.table as any)
        .select([...new Set([...selectFields, ...metricFields])].join(','))
        .gte(sourceDef.dateField, startStr)
        .lte(sourceDef.dateField, endStr);

      // Apply default filters
      sourceDef.defaultFilters.forEach(filter => {
        query = query.eq(filter.field, filter.value);
      });

      // Apply custom filters
      config.filters.forEach(filter => {
        switch (filter.operator) {
          case 'eq':
            query = query.eq(filter.field, filter.value);
            break;
          case 'neq':
            query = query.neq(filter.field, filter.value);
            break;
          case 'gt':
            query = query.gt(filter.field, filter.value);
            break;
          case 'gte':
            query = query.gte(filter.field, filter.value);
            break;
          case 'lt':
            query = query.lt(filter.field, filter.value);
            break;
          case 'lte':
            query = query.lte(filter.field, filter.value);
            break;
          case 'in':
            if (Array.isArray(filter.value)) {
              query = query.in(filter.field, filter.value);
            }
            break;
        }
      });

      const { data, error } = await query;

      if (error) {
        console.error('Report query error:', error);
        return [];
      }

      if (!data || data.length === 0) return [];

      // Aggregate data by dimension
      const aggregated = new Map<string, Record<string, number>>();

      data.forEach((row: any) => {
        const dimValue = formatDimensionValue(
          row[dimensionDef.field],
          config.dimension,
          dimensionDef.transform
        );

        if (!aggregated.has(dimValue)) {
          aggregated.set(dimValue, {});
          config.metrics.forEach(m => {
            aggregated.get(dimValue)![m] = 0;
          });
          aggregated.get(dimValue)!._count = 0;
        }

        const agg = aggregated.get(dimValue)!;
        agg._count++;

        config.metrics.forEach(metricKey => {
          const metricDef = sourceDef.metrics.find(m => m.key === metricKey);
          if (!metricDef) return;

          if (metricDef.aggregate === 'count') {
            agg[metricKey]++;
          } else if (metricDef.field) {
            const val = parseFloat(row[metricDef.field]) || 0;
            if (metricDef.aggregate === 'sum') {
              agg[metricKey] += val;
            } else if (metricDef.aggregate === 'avg') {
              agg[metricKey] += val; // Will divide later
            }
          }
        });
      });

      // Finalize averages and format results
      const results: ReportDataPoint[] = [];
      aggregated.forEach((metrics, label) => {
        const point: ReportDataPoint = { label };
        
        config.metrics.forEach(metricKey => {
          const metricDef = sourceDef.metrics.find(m => m.key === metricKey);
          if (metricDef?.aggregate === 'avg') {
            point[metricKey] = metrics._count > 0 ? Math.round(metrics[metricKey] / metrics._count) : 0;
          } else {
            point[metricKey] = Math.round(metrics[metricKey] * 100) / 100;
          }
        });
        
        results.push(point);
      });

      // Sort results
      if (dimensionDef.transform === 'month' || dimensionDef.transform === 'week') {
        // Sort chronologically for time dimensions
        results.sort((a, b) => a.label.localeCompare(b.label));
      } else {
        // Sort by first metric descending
        const firstMetric = config.metrics[0];
        results.sort((a, b) => (b[firstMetric] as number) - (a[firstMetric] as number));
      }

      return results.slice(0, 20); // Limit to top 20
    },
    enabled: !!config && config.metrics.length > 0 && !!config.dimension,
  });
}
