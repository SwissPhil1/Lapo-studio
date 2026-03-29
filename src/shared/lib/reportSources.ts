import { ReportSources } from '@/shared/types/reports';

export const REPORT_SOURCES: ReportSources = {
  bookings: {
    label: 'Rendez-vous',
    table: 'bookings',
    dateField: 'booking_date',
    metrics: [
      { key: 'revenue', label: 'Revenus (CHF)', aggregate: 'sum', field: 'booking_value' },
      { key: 'count', label: 'Nombre', aggregate: 'count' },
      { key: 'avg_value', label: 'Valeur moyenne', aggregate: 'avg', field: 'booking_value' },
    ],
    dimensions: [
      { key: 'service', label: 'Service', field: 'service' },
      { key: 'status', label: 'Statut', field: 'status' },
      { key: 'month', label: 'Mois', field: 'booking_date', transform: 'month' },
      { key: 'week', label: 'Semaine', field: 'booking_date', transform: 'week' },
    ],
    defaultFilters: [{ field: 'is_test', operator: 'eq', value: false }],
  },
  patients: {
    label: 'Patients',
    table: 'patients',
    dateField: 'created_at',
    metrics: [
      { key: 'count', label: 'Nombre', aggregate: 'count' },
    ],
    dimensions: [
      { key: 'gender', label: 'Genre', field: 'gender' },
      { key: 'city', label: 'Ville', field: 'city' },
      { key: 'acquisition_source', label: 'Source', field: 'acquisition_source' },
      { key: 'month', label: 'Mois', field: 'created_at', transform: 'month' },
    ],
    defaultFilters: [
      { field: 'is_test', operator: 'eq', value: false },
      { field: 'is_business_contact', operator: 'eq', value: false },
    ],
  },
  referrals: {
    label: 'Parrainages',
    table: 'referrals',
    dateField: 'created_at',
    metrics: [
      { key: 'count', label: 'Nombre', aggregate: 'count' },
    ],
    dimensions: [
      { key: 'status', label: 'Statut', field: 'status' },
      { key: 'month', label: 'Mois', field: 'created_at', transform: 'month' },
    ],
    defaultFilters: [{ field: 'is_test', operator: 'eq', value: false }],
  },
  communications: {
    label: 'Communications',
    table: 'crm_communication_logs',
    dateField: 'sent_at',
    metrics: [
      { key: 'count', label: 'Envoyés', aggregate: 'count' },
    ],
    dimensions: [
      { key: 'channel', label: 'Canal', field: 'channel' },
      { key: 'status', label: 'Statut', field: 'status' },
      { key: 'month', label: 'Mois', field: 'sent_at', transform: 'month' },
    ],
    defaultFilters: [],
  },
};

export const CHART_TYPES = [
  { key: 'bar', label: 'Barres', icon: 'BarChart3' },
  { key: 'line', label: 'Ligne', icon: 'LineChart' },
  { key: 'area', label: 'Aire', icon: 'AreaChart' },
  { key: 'pie', label: 'Camembert', icon: 'PieChart' },
  { key: 'table', label: 'Tableau', icon: 'Table' },
] as const;

export const RELATIVE_PERIODS = [
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: '90d', label: '3 derniers mois' },
  { value: '12m', label: '12 derniers mois' },
] as const;
