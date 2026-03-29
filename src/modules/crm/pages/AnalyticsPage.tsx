import { useState, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/lib/supabase';
import { format, subMonths, subDays, differenceInYears } from 'date-fns';
import { TrendingUp, TrendingDown, Users, Banknote, Calendar, Target, Download, RefreshCw, UserCheck, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/shared/lib/constants';
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

function ChartLoader() {
  return (
    <div className="flex h-48 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

type DateRange = '7d' | '30d' | '90d' | '12m' | 'ytd';

const dateRangeLabels: Record<DateRange, string> = {
  '7d': '7 derniers jours',
  '30d': '30 derniers jours',
  '90d': '3 derniers mois',
  '12m': '12 derniers mois',
  'ytd': 'Année en cours',
};

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
}

function MetricCard({ title, value, change, icon: Icon, subtitle }: MetricCardProps) {
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
              <span className="text-muted-foreground">vs période précédente</span>
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
      ['Métrique', 'Valeur'],
      ['Revenus', metrics?.revenue || 0],
      ['Nouveaux patients', metrics?.newPatients || 0],
      ['Rendez-vous', metrics?.appointments || 0],
      ['Taux de conversion', `${metrics?.conversionRate?.toFixed(1) || 0}%`],
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rapports & Analyses</h1>
          <p className="text-muted-foreground">Vue d'ensemble de la performance de votre clinique</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(dateRangeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-4xl grid-cols-8">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="demographics">Démographie</TabsTrigger>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
          <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
          <TabsTrigger value="revenue">Prévisions</TabsTrigger>
          <TabsTrigger value="predictions">IA Risques</TabsTrigger>
          <TabsTrigger value="roi">ROI Pubs</TabsTrigger>
          <TabsTrigger value="custom">Rapports</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Revenus" value={formatCurrency(metrics?.revenue || 0)} change={metrics?.revenueChange} icon={Banknote} />
            <MetricCard title="Nouveaux patients" value={metrics?.newPatients || 0} change={metrics?.patientsChange} icon={Users} />
            <MetricCard title="Rendez-vous" value={metrics?.appointments || 0} change={metrics?.appointmentsChange} icon={Calendar} />
            <MetricCard title="Taux de conversion" value={`${metrics?.conversionRate?.toFixed(1) || 0}%`} icon={Target} subtitle="RDV terminés / total" />
          </div>
          <Suspense fallback={<ChartLoader />}>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Évolution des revenus</h3>
              <RevenueChart dateRange={dateRange} />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Répartition par traitement</h3>
              <TreatmentBreakdown dateRange={dateRange} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Performance Staff</h3>
              <StaffPerformanceChart dateRange={dateRange} />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Efficacité Emails</h3>
              <CommunicationEffectiveness dateRange={dateRange} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Analyse Parrainages</h3>
              <ReferralAnalytics dateRange={dateRange} />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">No-Shows & Annulations</h3>
              <NoShowAnalysis dateRange={dateRange} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Entonnoir Pipeline</h3>
              <PipelineFunnel />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Métriques Rappel</h3>
              <RecallMetrics />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Workflows</h3>
              <WorkflowEffectiveness dateRange={dateRange} />
            </div>
          </div>
          
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Performance des campagnes</h3>
            <CampaignPerformance dateRange={dateRange} />
          </div>
          </Suspense>
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            <MetricCard title="Total Patients" value={demoMetrics?.total || 0} icon={Users} />
            <MetricCard title="% Femmes" value={`${demoMetrics?.femalePercent || 0}%`} icon={UserCheck} />
            <MetricCard title="Âge moyen" value={`${demoMetrics?.avgAge || 0} ans`} icon={Calendar} />
            <MetricCard title="Top ville" value={demoMetrics?.topCity || '-'} icon={MapPin} />
          </div>

          <Suspense fallback={<ChartLoader />}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Répartition par genre</h3>
              <GenderDistribution />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Tranches d'âge</h3>
              <AgeGroupDistribution />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Traitements par âge</h3>
              <TreatmentsByAgeGroup />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Traitements par genre</h3>
              <TreatmentsByGender />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Distribution géographique</h3>
              <GeographicDistribution />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Croissance patients</h3>
              <PatientGrowthTrend />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Valeur vie client (LTV)</h3>
              <PatientLifetimeValue />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Rétention & Churn</h3>
              <PatientRetentionMetrics />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Analyse premiers traitements</h3>
              <FirstTreatmentAnalysis />
            </div>
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Qualité des données</h3>
              <DatabaseHealthMetrics />
            </div>
          </div>
          </Suspense>
        </TabsContent>

        {/* Attribution Tab */}
        <TabsContent value="attribution" className="space-y-6">
          <Suspense fallback={<ChartLoader />}>
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Attribution & Sources</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Trackez la provenance de vos leads et mesurez le ROI de vos canaux d'acquisition (Google Ads, Meta, SEO, etc.)
            </p>
            <AttributionAnalytics dateRange={dateRange} />
          </div>
          </Suspense>
        </TabsContent>

        {/* Satisfaction Tab */}
        <TabsContent value="satisfaction" className="space-y-6">
          <Suspense fallback={<ChartLoader />}>
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Satisfaction Patients (NPS & CSAT)</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Suivez la satisfaction de vos patients et identifiez les axes d'amélioration
            </p>
            <SatisfactionAnalytics />
          </div>
          </Suspense>
        </TabsContent>

        {/* Revenue Forecast Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <Suspense fallback={<ChartLoader />}>
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Prévisions de revenus</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Projections basées sur le pipeline et les tendances historiques
            </p>
            <RevenueForecast />
          </div>
          </Suspense>
        </TabsContent>

        {/* AI Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <Suspense fallback={<ChartLoader />}>
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Prédictions IA - Risque de perte</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Identifiez les patients à risque de ne pas revenir grâce à l'analyse IA
            </p>
            <ChurnPrediction />
          </div>
          </Suspense>
        </TabsContent>

        {/* ROI Tab */}
        <TabsContent value="roi" className="space-y-6">
          <Suspense fallback={<ChartLoader />}>
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">ROI Publicitaire</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Mesurez le retour sur investissement de vos campagnes publicitaires
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
              <h2 className="text-lg font-semibold">Mes rapports personnalisés</h2>
              <p className="text-sm text-muted-foreground">Créez et gérez vos propres analyses</p>
            </div>
            <Button onClick={() => navigate('/crm/reports/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau rapport
            </Button>
          </div>
          <SavedReportsList />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
