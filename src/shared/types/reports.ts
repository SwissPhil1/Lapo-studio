export type ReportSource = 'bookings' | 'patients' | 'referrals' | 'communications';
export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'table';
export type DateRangeType = 'relative' | 'fixed';
export type RelativePeriod = '7d' | '30d' | '90d' | '12m';
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';

export interface ReportFilter {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | string[];
}

export interface ReportDateRange {
  type: DateRangeType;
  value?: RelativePeriod;
  start?: string;
  end?: string;
}

export interface ReportConfig {
  source: ReportSource;
  metrics: string[];
  dimension: string;
  dateRange: ReportDateRange;
  filters: ReportFilter[];
  chartType: ChartType;
}

export interface CustomReport {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  config: ReportConfig;
  is_favorite: boolean;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetricDefinition {
  key: string;
  label: string;
  aggregate: 'count' | 'sum' | 'avg';
  field?: string;
}

export interface DimensionDefinition {
  key: string;
  label: string;
  field: string;
  transform?: 'month' | 'week' | 'day';
}

export interface SourceDefinition {
  label: string;
  table: string;
  dateField: string;
  metrics: MetricDefinition[];
  dimensions: DimensionDefinition[];
  defaultFilters: ReportFilter[];
}

export type ReportSources = Record<ReportSource, SourceDefinition>;

export interface ReportDataPoint {
  label: string;
  [key: string]: string | number;
}
