import { useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/lib/supabase';
import { format, subMonths, subDays, differenceInYears } from 'date-fns';
import { TrendingUp, TrendingDown, Users, Banknote, Calendar, Target, Download, RefreshCw, UserCheck, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/shared/lib/format';
import { BOOKING_STATUS } from '@/shared/lib/bookingStatus';

// Lazy-load chart components by tab to reduce initial bundle
const RevenueChart = lazy(() => import('@/modules/crm/components/analytics/RevenueChart').then(m => ({ default: m.RevenueChart })));
const TreatmentBreakdown = lazy(() => import('@/modules/crm/components/analytics/TreatmentBreakdown').then(m => ({ default: m.TreatmentBreakdown })));
const PipelineFunnel = lazy(() => import('@/modules/crm/components/analytics/PipelineFunnel').then(m => ({ default: m.PipelineFunnel })));
const CampaignPerformance = lazy(() => import('@/modules/crm/components/analytics/CampaignPerformance').then(m => ({ default: m.CampaignPerformance })));
const RecallMetrics = lazy(() => import('@/modules/crm/components/analytics/RecallMetrics').then(m => ({ default: m.RecallMetrics })));
const StaffPerformanceChart = lazy(() => import('@/modules/crm/components/analytics/StaffPerformanceChart').then(m => ({ default: m.StaffPerformanceChart })));
const ReferralAnalytics = lazy(() => import('@/modules/crm/components/analytics/ReferralAnalytics').then(m => ({ default: m.ReferralAnalytics })));
const CommunicationEffectiveness = lazy(() => import('@/modules/crm/components/analytics/CommunicationEffectiveness').then(m => ({ default: m.CommunicationEffectiveness })));
const NoShowAnalysis = lazy(() => import('@/modules/crm/components/analytics/NoShowAnalysis').then(m => ({ default: m.NoShowAnalysis })));
const WorkflowEffectiveness = lazy(() => import('@/modules/crm/components/analytics/WorkflowEffectiveness').then(m => ({ default: m.WorkflowEffectiveness })));
const GenderDistribution = lazy(() => import('@/modules/crm/components/analytics/GenderDistribution').then(m => ({ default: m.GenderDistribution })));
const AgeGroupDistribution = lazy(() => import('@/modules/crm/components/analytics/AgeGroupDistribution').then(m => ({ default: m.AgeGroupDistribution })));
const TreatmentsByAgeGroup = lazy(() => import('@/modules/crm/components/analytics/TreatmentsByAgeGroup').then(m => ({ default: m.TreatmentsByAgeGroup })));
const TreatmentsByGender = lazy(() => import('@/modules/crm/components/analytics/TreatmentsByGender').then(m => ({ default: m.TreatmentsByGender })));
const GeographicDistribution = lazy(() => import('@/modules/crm/components/analytics/GeographicDistribution').then(m => ({ default: m.GeographicDistribution })));
const PatientGrowthTrend = lazy(() => import('@/modules/crm/components/analytics/PatientGrowthTrend').then(m => ({ default: m.PatientGrowthTrend })));
const PatientLifetimeValue = lazy(() => import('@/modules/crm/components/analytics/PatientLifetimeValue').then(m => ({ default: m.PatientLifetimeValue })));
const PatientRetentionMetrics = lazy(() => import('@/modules/crm/components/analytics/PatientRetentionMetrics').then(m => ({ default: m.PatientRetentionMetrics })));
const FirstTreatmentAnalysis = lazy(() => import('@/modules/crm/components/analytics/FirstTreatmentAnalysis').then(m => ({ default: m.FirstTreatmentAnalysis })));
const DatabaseHealthMetrics = lazy(() => import('@/modules/crm/components/analytics/DatabaseHealthMetrics').then(m => ({ default: m.DatabaseHealthMetrics })));
const SavedReportsList = lazy(() => import('@/modules/crm/components/reports/SavedReportsList').then(m => ({ default: m.SavedReportsList })));
const AttributionAnalytics = lazy(() => import('@/modules/crm/components/analytics/AttributionAnalytics').then(m => ({ default: m.AttributionAnalytics })));
const SatisfactionAnalytics = lazy(() => import('@/modules/crm/components/analytics/SatisfactionAnalytics').then(m => ({ default: m.SatisfactionAnalytics })));
const RevenueForecast = lazy(() => import('@/modules/crm/components/analytics/RevenueForecast').then(m => ({ default: m.RevenueForecast })));
const ChurnPrediction = lazy(() => import('@/modules/crm/components/analytics/ChurnPrediction').then(m => ({ default: m.ChurnPrediction })));
const ROICalculator = lazy(() => import('@/modules/crm/components/analytics/ROICalculator').then(m => ({ default: m.ROICalculator })));
const CohortAnalysis = lazy(() => import('@/modules/crm/components/analytics/CohortAnalysis').then(m => ({ default: m.CohortAnalysis })));
const LTVAnalysis = lazy(() => import('@/modules/crm/components/analytics/LTVAnalysis').then(m => ({ default: m.LTVAnalysis })));
const CACAnalysis = lazy(() => import('@/modules/crm/components/analytics/CACAnalysis').then(m => ({ default: m.CACAnalysis })));

function ChartLoader() {
  return (
    <div className="flex h-48 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

type DateRange = '7d' | '30d' | '90d' | '12m' | 'ytd';

const DATE_RANGE_KEYS: DateRange[] = ['7d', '30d', '90d', '12m', 'ytd'];

function getDateRange(range: DateRange): { start: Date; end: Date } {
  const end = new Date();
  let start: Date;
  
  switch (range) {
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
      start = subMonths(end, 12);
      break;
    case 'ytd':
      start = new Date(end.getFullYear(), 0, 1);
      break;
    default:
      start = subMonths(end, 12);
  }
  
  return { start, end };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  subtitle?: string;
  vsPeriodLabel?: string;
}

function MetricCard({ title, value, change, icon: Icon, subtitle, vsPeriodLabel = 'vs previous period' }: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;
  
  return (
    <div className="card-elevated p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-1 text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
              <span className="text-muted-foreground">{vsPeriodLabel}</span>
            </div>
          )}
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { t } = useTranslation(['analytics', 'common']);
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [activeTab, setActiveTab] = useState('performance');
  const { start, end } = getDateRange(dateRange);
  
  // Fetch performance metrics
  const { data: metrics, refetch } = useQuery({
    queryKey: ['analytics-metrics', dateRange],
    queryFn: async () => {
      const startStr = start.toISOString();
      const endStr = end.toISOString();
      const periodLength = end.getTime() - start.getTime();
      const prevStart = new Date(start.getTime() - periodLength);
      const prevEnd = start;
      const prevStartStr = prevStart.toISOString();
      const prevEndStr = prevEnd.toISOString();
      
      const { data: currentBookings } = await supabase
        .from('bookings')
        .select('booking_value')
        .eq('status', BOOKING_STATUS.COMPLETED)
        .eq('is_test', false)
        .gte('booking_date', startStr)
        .lte('booking_date', endStr);
      
      const currentRevenue = currentBookings?.reduce((sum, b) => sum + (b.booking_value || 0), 0) || 0;
      
      const { data: prevBookings } = await supabase
        .from('bookings')
        .select('booking_value')
        .eq('status', BOOKING_STATUS.COMPLETED)
        .eq('is_test', false)
        .gte('booking_date', prevStartStr)
        .lte('booking_date', prevEndStr);
      
      const prevRevenue = prevBookings?.reduce((sum, b) => sum + (b.booking_value || 0), 0) || 0;
      const revenueChange = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
      
      const { data: currentPatients } = await supabase
        .from('patients')
        .select('id')
        .gte('created_at', startStr)
        .lte('created_at', endStr);
      
      const newPatients = currentPatients?.length || 0;
      
      const { data: prevPatients } = await supabase
        .from('patients')
        .select('id')
        .gte('created_at', prevStartStr)
        .lte('created_at', prevEndStr);
      
      const prevNewPatients = prevPatients?.length || 0;
      const patientsChange = prevNewPatients > 0 ? ((newPatients - prevNewPatients) / prevNewPatients) * 100 : 0;
      
      const { count: currentAppointments } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('is_test', false)
        .gte('booking_date', startStr)
        .lte('booking_date', endStr);
      
      const { count: prevAppointments } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('is_test', false)
        .gte('booking_date', prevStartStr)
        .lte('booking_date', prevEndStr);
      
      const appointmentsChange = (prevAppointments || 0) > 0 
        ? (((currentAppointments || 0) - (prevAppointments || 0)) / (prevAppointments || 1)) * 100 
        : 0;
      
      const { count: completedCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', BOOKING_STATUS.COMPLETED)
        .eq('is_test', false)
        .gte('booking_date', startStr)
        .lte('booking_date', endStr);
      
      const conversionRate = (currentAppointments || 0) > 0 
        ? ((completedCount || 0) / (currentAppointments || 1)) * 100 
        : 0;
      
      return {
        revenue: currentRevenue,
        revenueChange,
        newPatients,
        patientsChange,
        appointments: currentAppointments || 0,
        appointmentsChange,
        conversionRate,
      };
    },
  });

  // Fetch demographics metrics
  const { data: demoMetrics } = useQuery({
    queryKey: ['demographics-metrics'],
    queryFn: async () => {
      const { data: patients } = await supabase
        .from('patients')
        .select('gender, date_of_birth, city')
        .eq('is_test', false)
        .eq('is_business_contact', false);

      const total = patients?.length || 0;
      const females = patients?.filter(p => p.gender?.toLowerCase() === 'female').length || 0;
      const femalePercent = total > 0 ? Math.round((females / total) * 100) : 0;

      const today = new Date();
      const ages = patients
        ?.filter(p => p.date_of_birth)
        .map(p => differenceInYears(today, new Date(p.date_of_birth!))) || [];
      const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

      const cityCount = new Map<string, number>();
      patients?.forEach(p => {
        if (p.city) cityCount.set(p.city, (cityCount.get(p.city) || 0) + 1);
      });
      const topCity = Array.from(cityCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

      return { total, femalePercent, avgAge, topCity };
    },
  });
  
  const handleExport = () => {
    const data = [
      [t('analytics:exportHeaders.metric'), t('analytics:exportHeaders.value')],
      [t('analytics:metrics.revenue'), metrics?.revenue || 0],
      [t('analytics:metrics.newPatients'), metrics?.newPatients || 0],
      [t('analytics:metrics.appointments'), metrics?.appointments || 0],
      [t('analytics:metrics.conversionRate'), `${metrics?.conversionRate?.toFixed(1) || 0}%`],
    ];
    
    const csv = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('analytics:title')}</h1>
          <p className="text-muted-foreground">{t('analytics:description')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_KEYS.map((value) => (
                <SelectItem key={value} value={value}>{t(`analytics:dateRanges.${value}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {t('analytics:export')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-6xl grid-cols-11">
          <TabsTrigger value="performance">{t('analytics:tabs.performance')}</TabsTrigger>
          <TabsTrigger value="demographics">{t('analytics:tabs.demographics')}</TabsTrigger>
          <TabsTrigger value="cohort">{t('analytics:tabs.cohort', { defaultValue: 'Cohort' })}</TabsTrigger>
          <TabsTrigger value="ltv">{t('analytics:tabs.ltv', { defaultValue: 'LTV' })}</TabsTrigger>
          <TabsTrigger value="cac">{t('analytics:tabs.cac', { defaultValue: 'CAC' })}</TabsTrigger>
          <TabsTrigger value="attribution">{t('analytics:tabs.attribution')}</TabsTrigger>
          <TabsTrigger value="satisfaction">{t('analytics:tabs.satisfaction')}</TabsTrigger>
          <TabsTrigger value="revenue">{t('analytics:tabs.revenue')}</TabsTrigger>
          <TabsTrigger value="predictions">{t('analytics:tabs.predictions')}</TabsTrigger>
          <TabsTrigger value="roi">{t('analytics:tabs.roi')}</TabsTrigger>
          <TabsTrigger value="custom">{t('analytics:tabs.custom')}</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title={t('analytics:metrics.revenue')} value={formatCurrency(metrics?.revenue || 0)} change={metrics?.revenueChange} icon={Banknote} vsPeriodLabel={t('analytics:vsPreviousPeriod')} />
            <MetricCard title={t('analytics:metrics.newPatients')} value={metrics?.newPatients || 0} change={metrics?.patientsChange} icon={Users} vsPeriodLabel={t('analytics:vsPreviousPeriod')} />
            <MetricCard title={t('analytics:metrics.appointments')} value={metrics?.appointments || 0} change={metrics?.appointmentsChange} icon={Calendar} vsPeriodLabel={t('analytics:vsPreviousPeriod')} />
            <MetricCard title={t('analytics:metrics.conversionRate')} value={`${metrics?.conversionRate?.toFixed(1) || 0}%`} icon={Target} subtitle={t('analytics:metrics.completedPerTotal')} />
          </div>
          <Suspense fallback={<ChartLoader />}>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.revenueEvolution')}</h3>
              <RevenueChart dateRange={dateRange} />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.treatmentBreakdown')}</h3>
              <TreatmentBreakdown dateRange={dateRange} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.staffPerformance')}</h3>
              <StaffPerformanceChart dateRange={dateRange} />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.emailEffectiveness')}</h3>
              <CommunicationEffectiveness dateRange={dateRange} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.referralAnalysis')}</h3>
              <ReferralAnalytics dateRange={dateRange} />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.noShowCancellations')}</h3>
              <NoShowAnalysis dateRange={dateRange} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.pipelineFunnel')}</h3>
              <PipelineFunnel />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.recallMetrics')}</h3>
              <RecallMetrics />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.workflows')}</h3>
              <WorkflowEffectiveness dateRange={dateRange} />
            </div>
          </div>

          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.campaignPerformance')}</h3>
            <CampaignPerformance dateRange={dateRange} />
          </div>
          </Suspense>
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title={t('analytics:metrics.totalPatients')} value={demoMetrics?.total || 0} icon={Users} />
            <MetricCard title={t('analytics:metrics.percentFemale')} value={`${demoMetrics?.femalePercent || 0}%`} icon={UserCheck} />
            <MetricCard title={t('analytics:metrics.avgAge')} value={`${demoMetrics?.avgAge || 0} ${t('analytics:metrics.years')}`} icon={Calendar} />
            <MetricCard title={t('analytics:metrics.topCity')} value={demoMetrics?.topCity || '-'} icon={MapPin} />
          </div>

          <Suspense fallback={<ChartLoader />}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.genderDistribution')}</h3>
              <GenderDistribution />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.ageGroups')}</h3>
              <AgeGroupDistribution />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.treatmentsByAge')}</h3>
              <TreatmentsByAgeGroup />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.treatmentsByGender')}</h3>
              <TreatmentsByGender />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.geographicDistribution')}</h3>
              <GeographicDistribution />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.patientGrowth')}</h3>
              <PatientGrowthTrend />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.lifetimeValue')}</h3>
              <PatientLifetimeValue />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.retentionChurn')}</h3>
              <PatientRetentionMetrics />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.firstTreatmentAnalysis')}</h3>
              <FirstTreatmentAnalysis />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.dataQuality')}</h3>
              <DatabaseHealthMetrics />
            </div>
          </div>
          </Suspense>
        </TabsContent>

        {/* Cohort Tab */}
        <TabsContent value="cohort" className="space-y-6">
          <Suspense fallback={<ChartLoader />}>
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t('analytics:cohortAnalysis', { defaultValue: 'Cohort Analysis' })}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('analytics:cohortRetention', { defaultValue: 'Retention' })} - {t('analytics:descriptions.cohort', { defaultValue: 'Track patient retention by acquisition month' })}
            </p>
            <CohortAnalysis />
          </div>
          </Suspense>
        </TabsContent>

        {/* LTV Tab */}
        <TabsContent value="ltv" className="space-y-6">
          <Suspense fallback={<ChartLoader />}>
            <LTVAnalysis />
          </Suspense>
        </TabsContent>

        {/* CAC Tab */}
        <TabsContent value="cac" className="space-y-6">
          <Suspense fallback={<ChartLoader />}>
            <CACAnalysis />
          </Suspense>
        </TabsContent>

        {/* Attribution Tab */}
        <TabsContent value="attribution" className="space-y-6">
          <Suspense fallback={<ChartLoader />}>
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.attributionSources')}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('analytics:descriptions.attribution')}
            </p>
            <AttributionAnalytics dateRange={dateRange} />
          </div>
          </Suspense>
        </TabsContent>

        {/* Satisfaction Tab */}
        <TabsContent value="satisfaction" className="space-y-6">
          <Suspense fallback={<ChartLoader />}>
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.satisfactionNps')}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('analytics:descriptions.satisfaction')}
            </p>
            <SatisfactionAnalytics />
          </div>
          </Suspense>
        </TabsContent>

        {/* Revenue Forecast Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <Suspense fallback={<ChartLoader />}>
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.revenueForecast')}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('analytics:descriptions.forecast')}
            </p>
            <RevenueForecast />
          </div>
          </Suspense>
        </TabsContent>

        {/* AI Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <Suspense fallback={<ChartLoader />}>
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.churnPrediction')}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('analytics:descriptions.churn')}
            </p>
            <ChurnPrediction />
          </div>
          </Suspense>
        </TabsContent>

        {/* ROI Tab */}
        <TabsContent value="roi" className="space-y-6">
          <Suspense fallback={<ChartLoader />}>
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">{t('analytics:charts.adRoi')}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('analytics:descriptions.roi')}
            </p>
            <ROICalculator />
          </div>
          </Suspense>
        </TabsContent>

        {/* Custom Reports Tab */}
        <TabsContent value="custom" className="space-y-6">
          <Suspense fallback={<ChartLoader />}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{t('analytics:customReports.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('analytics:customReports.description')}</p>
            </div>
            <Button onClick={() => navigate('/crm/reports/new')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('analytics:customReports.newReport')}
            </Button>
          </div>
          <SavedReportsList />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
