import i18n from '@/i18n';
import type { ReportSources } from '@/shared/types/reports';

export function getReportSources(): ReportSources {
  return {
    bookings: {
      label: i18n.t('reports:bookings'),
      table: 'bookings',
      dateField: 'booking_date',
      metrics: [
        { key: 'revenue', label: i18n.t('reports:revenue'), aggregate: 'sum', field: 'booking_value' },
        { key: 'count', label: i18n.t('reports:count'), aggregate: 'count' },
        { key: 'avg_value', label: i18n.t('reports:avgValue'), aggregate: 'avg', field: 'booking_value' },
      ],
      dimensions: [
        { key: 'service', label: i18n.t('reports:service'), field: 'service' },
        { key: 'status', label: i18n.t('reports:status'), field: 'status' },
        { key: 'month', label: i18n.t('reports:month'), field: 'booking_date', transform: 'month' },
        { key: 'week', label: i18n.t('reports:week'), field: 'booking_date', transform: 'week' },
      ],
      defaultFilters: [{ field: 'is_test', operator: 'eq', value: false }],
    },
    patients: {
      label: i18n.t('reports:patients'),
      table: 'patients',
      dateField: 'created_at',
      metrics: [
        { key: 'count', label: i18n.t('reports:count'), aggregate: 'count' },
      ],
      dimensions: [
        { key: 'gender', label: i18n.t('reports:gender'), field: 'gender' },
        { key: 'city', label: i18n.t('reports:city'), field: 'city' },
        { key: 'acquisition_source', label: i18n.t('reports:source'), field: 'acquisition_source' },
        { key: 'month', label: i18n.t('reports:month'), field: 'created_at', transform: 'month' },
      ],
      defaultFilters: [
        { field: 'is_test', operator: 'eq', value: false },
        { field: 'is_business_contact', operator: 'eq', value: false },
      ],
    },
    referrals: {
      label: i18n.t('reports:referrals'),
      table: 'referrals',
      dateField: 'created_at',
      metrics: [
        { key: 'count', label: i18n.t('reports:count'), aggregate: 'count' },
      ],
      dimensions: [
        { key: 'status', label: i18n.t('reports:status'), field: 'status' },
        { key: 'month', label: i18n.t('reports:month'), field: 'created_at', transform: 'month' },
      ],
      defaultFilters: [{ field: 'is_test', operator: 'eq', value: false }],
    },
    communications: {
      label: i18n.t('reports:communications'),
      table: 'crm_communication_logs',
      dateField: 'sent_at',
      metrics: [
        { key: 'count', label: i18n.t('reports:sent'), aggregate: 'count' },
      ],
      dimensions: [
        { key: 'channel', label: i18n.t('reports:channel'), field: 'channel' },
        { key: 'status', label: i18n.t('reports:status'), field: 'status' },
        { key: 'month', label: i18n.t('reports:month'), field: 'sent_at', transform: 'month' },
      ],
      defaultFilters: [],
    },
  };
}

export function getChartTypes() {
  return [
    { key: 'bar', label: i18n.t('reports:chartBar'), icon: 'BarChart3' },
    { key: 'line', label: i18n.t('reports:chartLine'), icon: 'LineChart' },
    { key: 'area', label: i18n.t('reports:chartArea'), icon: 'AreaChart' },
    { key: 'pie', label: i18n.t('reports:chartPie'), icon: 'PieChart' },
    { key: 'table', label: i18n.t('reports:chartTable'), icon: 'Table' },
  ] as const;
}

export function getRelativePeriods() {
  return [
    { value: '7d', label: i18n.t('reports:period7d') },
    { value: '30d', label: i18n.t('reports:period30d') },
    { value: '90d', label: i18n.t('reports:period90d') },
    { value: '12m', label: i18n.t('reports:period12m') },
  ] as const;
}

// Keep backward-compatible exports as getters
export const REPORT_SOURCES: ReportSources = new Proxy({} as ReportSources, {
  get(_target, prop) {
    return getReportSources()[prop as keyof ReportSources];
  },
  ownKeys() {
    return Object.keys(getReportSources());
  },
  getOwnPropertyDescriptor(_target, prop) {
    const sources = getReportSources();
    if (prop in sources) {
      return { configurable: true, enumerable: true, value: sources[prop as keyof ReportSources] };
    }
    return undefined;
  },
});

export const CHART_TYPES = new Proxy([] as unknown as readonly { key: string; label: string; icon: string }[], {
  get(_target, prop) {
    const types = getChartTypes();
    if (prop === 'length') return types.length;
    if (prop === Symbol.iterator) return types[Symbol.iterator].bind(types);
    if (typeof prop === 'string' && !isNaN(Number(prop))) return types[Number(prop)];
    if (prop === 'map') return types.map.bind(types);
    if (prop === 'forEach') return types.forEach.bind(types);
    if (prop === 'find') return types.find.bind(types);
    if (prop === 'filter') return types.filter.bind(types);
    return (types as any)[prop];
  },
});

export const RELATIVE_PERIODS = new Proxy([] as unknown as readonly { value: string; label: string }[], {
  get(_target, prop) {
    const periods = getRelativePeriods();
    if (prop === 'length') return periods.length;
    if (prop === Symbol.iterator) return periods[Symbol.iterator].bind(periods);
    if (typeof prop === 'string' && !isNaN(Number(prop))) return periods[Number(prop)];
    if (prop === 'map') return periods.map.bind(periods);
    if (prop === 'forEach') return periods.forEach.bind(periods);
    if (prop === 'find') return periods.find.bind(periods);
    if (prop === 'filter') return periods.filter.bind(periods);
    return (periods as any)[prop];
  },
});
