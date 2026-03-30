import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/lib/supabase';
import { formatCurrency } from '@/shared/lib/format';
import { BOOKING_STATUS } from '@/shared/lib/bookingStatus';
import { cn } from '@/shared/lib/utils';
import { motion, MotionList, MotionItem, fadeIn } from '@/shared/components/motion';
import {
  format,
  subDays,
  subMonths,
  parseISO,
  eachDayOfInterval,
  eachWeekOfInterval,
  isWithinInterval,
} from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DateRange {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  label: string;
}

interface StatMetric {
  label: string;
  value: string | number;
  previousValue?: number;
  change?: number;
  sparkline?: number[];
  prefix?: string;
  suffix?: string;
  format?: 'currency' | 'percent' | 'number';
}

// ---------------------------------------------------------------------------
// Date range helpers
// ---------------------------------------------------------------------------

function getDateRange(period: string): DateRange {
  const now = new Date();
  let start: Date, end: Date, prevStart: Date, prevEnd: Date, label: string;

  switch (period) {
    case '7d':
      end = now;
      start = subDays(now, 7);
      prevEnd = subDays(start, 1);
      prevStart = subDays(prevEnd, 7);
      label = '7 days';
      break;
    case '30d':
      end = now;
      start = subDays(now, 30);
      prevEnd = subDays(start, 1);
      prevStart = subDays(prevEnd, 30);
      label = '30 days';
      break;
    case '90d':
      end = now;
      start = subDays(now, 90);
      prevEnd = subDays(start, 1);
      prevStart = subDays(prevEnd, 90);
      label = '90 days';
      break;
    case '12m':
    default:
      end = now;
      start = subMonths(now, 12);
      prevEnd = subDays(start, 1);
      prevStart = subMonths(prevEnd, 12);
      label = '12 months';
      break;
  }

  return { start, end, prevStart, prevEnd, label };
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// ---------------------------------------------------------------------------
// Inline Sparkline (Linear-style)
// ---------------------------------------------------------------------------

function Sparkline({ data, color = 'var(--color-primary)', height = 32, className }: {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = height;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn('shrink-0', className)}
      style={{ width: w, height: h }}
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Trend Indicator (Linear-style)
// ---------------------------------------------------------------------------

function TrendBadge({ value, invert }: { value?: number; invert?: boolean }) {
  if (value === undefined || value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Minus className="h-3 w-3" />
        0%
      </span>
    );
  }

  const isPositive = invert ? value < 0 : value > 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        isPositive ? 'text-success' : 'text-destructive'
      )}
    >
      {value > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {value > 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

// ---------------------------------------------------------------------------
// Stat Row (Linear-style minimal metric row)
// ---------------------------------------------------------------------------

function StatRow({ metric, onClick }: { metric: StatMetric; onClick?: () => void }) {
  return (
    <motion.div
      variants={fadeIn}
      className={cn(
        'group flex items-center justify-between py-3 px-4 -mx-4 rounded-lg transition-colors',
        onClick && 'cursor-pointer hover:bg-accent/50'
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm text-muted-foreground truncate">{metric.label}</span>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        {metric.sparkline && <Sparkline data={metric.sparkline} height={24} />}
        <TrendBadge value={metric.change} />
        <span className="text-sm font-semibold text-foreground tabular-nums min-w-[5rem] text-right">
          {metric.prefix}{metric.value}{metric.suffix}
        </span>
        {onClick && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Section Card (Linear-style section container)
// ---------------------------------------------------------------------------

function Section({ title, subtitle, children, className }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeIn}
      className={cn('rounded-xl border border-border bg-card p-6', className)}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Big Number Card (Linear-style hero metric)
// ---------------------------------------------------------------------------

function BigNumber({ label, value, change, sparkline, loading }: {
  label: string;
  value: string;
  change?: number;
  sparkline?: number[];
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      {loading ? (
        <div className="h-8 w-24 rounded bg-muted animate-pulse" />
      ) : (
        <div className="flex items-end gap-3">
          <span className="text-2xl font-bold text-foreground tabular-nums">{value}</span>
          <TrendBadge value={change} />
        </div>
      )}
      {sparkline && !loading && (
        <div className="mt-1">
          <Sparkline data={sparkline} height={28} className="opacity-60" />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini Bar Chart (Linear-style inline chart)
// ---------------------------------------------------------------------------

function MiniBarChart({ data, color = 'hsl(var(--primary))' }: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-20 truncate">{item.label}</span>
          <div className="flex-1 h-5 bg-accent/30 rounded-sm overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-sm"
              style={{ backgroundColor: color }}
            />
          </div>
          <span className="text-xs font-medium text-foreground tabular-nums w-12 text-right">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function StatisticsPage() {
  const { t } = useTranslation(['analytics', 'crmDashboard', 'common']);
  const navigate = useNavigate();
  const [period, setPeriod] = useState('30d');
  const range = getDateRange(period);

  // -----------------------------------------------------------------------
  // Data Queries
  // -----------------------------------------------------------------------

  // 1. All bookings in current + previous period
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['stats-bookings', period],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select('id, booking_date, booking_value, status, service, patient_id, is_test')
        .gte('booking_date', format(range.prevStart, 'yyyy-MM-dd'))
        .lte('booking_date', format(range.end, 'yyyy-MM-dd'))
        .eq('is_test', false);
      return data || [];
    },
  });

  // 2. All patients
  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ['stats-patients', period],
    queryFn: async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, created_at, gender, city, date_of_birth, is_test')
        .eq('is_test', false);
      return data || [];
    },
  });

  // 3. Pipeline data
  const { data: pipelineData } = useQuery({
    queryKey: ['stats-pipeline'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pipeline_patients')
        .select('id, stage_id, entered_at, priority, patient_id');
      return data || [];
    },
  });

  // 4. Pipeline stages
  const { data: stagesData } = useQuery({
    queryKey: ['stats-stages'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pipeline_stages')
        .select('id, name, color, position')
        .order('position');
      return data || [];
    },
  });

  // 5. Campaigns
  const { data: campaignsData } = useQuery({
    queryKey: ['stats-campaigns'],
    queryFn: async () => {
      const { data } = await supabase
        .from('crm_campaigns')
        .select('id, name, status, channel, created_at');
      return data || [];
    },
  });

  // 6. Communication logs
  const { data: commsData } = useQuery({
    queryKey: ['stats-comms', period],
    queryFn: async () => {
      const { data } = await supabase
        .from('crm_communication_logs')
        .select('id, status, sent_at, clicked_at, bounced_at, channel')
        .gte('sent_at', format(range.prevStart, 'yyyy-MM-dd'));
      return data || [];
    },
  });

  // 7. Reactivation tasks
  const { data: tasksData } = useQuery({
    queryKey: ['stats-tasks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('reactivation_tasks')
        .select('id, task_type, status, due_date, completed_at, created_at');
      return data || [];
    },
  });

  // -----------------------------------------------------------------------
  // Computed Metrics
  // -----------------------------------------------------------------------

  const metrics = useMemo(() => {
    if (!bookingsData) return null;

    const currentBookings = bookingsData.filter(b =>
      isWithinInterval(parseISO(b.booking_date), { start: range.start, end: range.end })
    );
    const prevBookings = bookingsData.filter(b =>
      isWithinInterval(parseISO(b.booking_date), { start: range.prevStart, end: range.prevEnd })
    );

    // Revenue
    const currentRevenue = currentBookings
      .filter(b => b.status === BOOKING_STATUS.COMPLETED)
      .reduce((sum, b) => sum + (b.booking_value || 0), 0);
    const prevRevenue = prevBookings
      .filter(b => b.status === BOOKING_STATUS.COMPLETED)
      .reduce((sum, b) => sum + (b.booking_value || 0), 0);

    // Revenue sparkline (daily for 7d/30d, weekly for 90d/12m)
    const isLongRange = period === '90d' || period === '12m';
    const intervals = isLongRange
      ? eachWeekOfInterval({ start: range.start, end: range.end })
      : eachDayOfInterval({ start: range.start, end: range.end });
    const revenueSparkline = intervals.map((date, i) => {
      const nextDate = intervals[i + 1] || range.end;
      return currentBookings
        .filter(b => {
          const d = parseISO(b.booking_date);
          return d >= date && d < nextDate && b.status === BOOKING_STATUS.COMPLETED;
        })
        .reduce((sum, b) => sum + (b.booking_value || 0), 0);
    });

    // Appointments
    const currentAppts = currentBookings.length;
    const prevAppts = prevBookings.length;

    // Appointments sparkline
    const apptSparkline = intervals.map((date, i) => {
      const nextDate = intervals[i + 1] || range.end;
      return currentBookings.filter(b => {
        const d = parseISO(b.booking_date);
        return d >= date && d < nextDate;
      }).length;
    });

    // Completed / No-show / Cancelled
    const completed = currentBookings.filter(b => b.status === BOOKING_STATUS.COMPLETED).length;
    const noShows = currentBookings.filter(b => b.status === BOOKING_STATUS.NO_SHOW).length;
    const cancelled = currentBookings.filter(b => b.status === BOOKING_STATUS.CANCELLED).length;
    const prevCompleted = prevBookings.filter(b => b.status === BOOKING_STATUS.COMPLETED).length;
    const prevNoShows = prevBookings.filter(b => b.status === BOOKING_STATUS.NO_SHOW).length;


    // Completion rate
    const completionRate = currentAppts > 0 ? (completed / currentAppts) * 100 : 0;
    const prevCompletionRate = prevAppts > 0 ? (prevCompleted / prevAppts) * 100 : 0;

    // No-show rate
    const noShowRate = currentAppts > 0 ? (noShows / currentAppts) * 100 : 0;
    const prevNoShowRate = prevAppts > 0 ? (prevNoShows / prevAppts) * 100 : 0;

    // Avg booking value
    const avgValue = completed > 0 ? currentRevenue / completed : 0;
    const prevAvgValue = prevCompleted > 0 ? prevRevenue / prevCompleted : 0;

    // New patients in period
    const newPatients = (patientsData || []).filter(p => {
      if (!p.created_at) return false;
      const d = parseISO(p.created_at);
      return isWithinInterval(d, { start: range.start, end: range.end });
    }).length;
    const prevNewPatients = (patientsData || []).filter(p => {
      if (!p.created_at) return false;
      const d = parseISO(p.created_at);
      return isWithinInterval(d, { start: range.prevStart, end: range.prevEnd });
    }).length;

    // New patients sparkline
    const newPatientsSparkline = intervals.map((date, i) => {
      const nextDate = intervals[i + 1] || range.end;
      return (patientsData || []).filter(p => {
        if (!p.created_at) return false;
        const d = parseISO(p.created_at);
        return d >= date && d < nextDate;
      }).length;
    });

    // Retention (patients with 2+ completed bookings)
    const uniquePatients = new Set(currentBookings.map(b => b.patient_id));
    const returningPatients = [...uniquePatients].filter(pid =>
      currentBookings.filter(b => b.patient_id === pid && b.status === BOOKING_STATUS.COMPLETED).length >= 2
    ).length;
    const retentionRate = uniquePatients.size > 0 ? (returningPatients / uniquePatients.size) * 100 : 0;

    // Top services
    const serviceCounts: Record<string, number> = {};
    currentBookings.filter(b => b.status === BOOKING_STATUS.COMPLETED).forEach(b => {
      const svc = b.service || 'Unknown';
      serviceCounts[svc] = (serviceCounts[svc] || 0) + 1;
    });
    const topServices = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));

    // Revenue by service
    const serviceRevenue: Record<string, number> = {};
    currentBookings.filter(b => b.status === BOOKING_STATUS.COMPLETED).forEach(b => {
      const svc = b.service || 'Unknown';
      serviceRevenue[svc] = (serviceRevenue[svc] || 0) + (b.booking_value || 0);
    });
    const topRevenueServices = Object.entries(serviceRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value: Math.round(value) }));

    // Pipeline stats
    const pipelineByStage = (stagesData || []).map(stage => ({
      label: stage.name,
      value: (pipelineData || []).filter(p => p.stage_id === stage.id).length,
      color: stage.color || '#6b7280',
    }));
    const totalInPipeline = (pipelineData || []).length;

    // Communication stats
    const currentComms = (commsData || []).filter(c =>
      c.sent_at && isWithinInterval(parseISO(c.sent_at), { start: range.start, end: range.end })
    );
    const totalSent = currentComms.length;
    const totalOpened = currentComms.filter(c => c.clicked_at).length;
    const totalBounced = currentComms.filter(c => c.bounced_at).length;
    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

    // Campaign stats
    const activeCampaigns = (campaignsData || []).filter(c => c.status === 'active').length;
    const completedCampaigns = (campaignsData || []).filter(c => c.status === 'completed').length;

    // Task stats
    const pendingTasks = (tasksData || []).filter(t => t.status === 'pending').length;
    const overdueTasks = (tasksData || []).filter(t =>
      t.status === 'pending' && t.due_date && parseISO(t.due_date) < new Date()
    ).length;
    const completedTasks = (tasksData || []).filter(t => t.status === 'completed').length;
    const taskCompletionRate = (pendingTasks + completedTasks) > 0
      ? (completedTasks / (pendingTasks + completedTasks)) * 100
      : 0;

    // Status distribution for donut-style display
    const statusDistribution = [
      { label: 'Completed', value: completed, color: 'hsl(var(--success))' },
      { label: 'Scheduled', value: currentBookings.filter(b => b.status === BOOKING_STATUS.SCHEDULED).length, color: 'hsl(var(--primary))' },
      { label: 'No-show', value: noShows, color: 'hsl(var(--destructive))' },
      { label: 'Cancelled', value: cancelled, color: 'hsl(var(--muted-foreground))' },
    ].filter(d => d.value > 0);

    // Revenue by day-of-week
    const dayOfWeekRevenue = [0, 1, 2, 3, 4, 5, 6].map(dayIdx => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayBookings = currentBookings.filter(b => {
        const d = parseISO(b.booking_date);
        return d.getDay() === dayIdx && b.status === BOOKING_STATUS.COMPLETED;
      });
      return {
        label: dayNames[dayIdx],
        value: Math.round(dayBookings.reduce((s, b) => s + (b.booking_value || 0), 0)),
      };
    });

    return {
      revenue: { current: currentRevenue, prev: prevRevenue, sparkline: revenueSparkline, change: pctChange(currentRevenue, prevRevenue) },
      appointments: { current: currentAppts, prev: prevAppts, sparkline: apptSparkline, change: pctChange(currentAppts, prevAppts) },
      newPatients: { current: newPatients, prev: prevNewPatients, sparkline: newPatientsSparkline, change: pctChange(newPatients, prevNewPatients) },
      avgValue: { current: avgValue, prev: prevAvgValue, change: pctChange(avgValue, prevAvgValue) },
      completionRate: { current: completionRate, prev: prevCompletionRate, change: completionRate - prevCompletionRate },
      noShowRate: { current: noShowRate, prev: prevNoShowRate, change: noShowRate - prevNoShowRate },
      retentionRate,
      completed,
      noShows,
      cancelled,
      topServices,
      topRevenueServices,
      pipelineByStage,
      totalInPipeline,
      statusDistribution,
      dayOfWeekRevenue,
      comms: { totalSent, openRate, bounceRate },
      campaigns: { active: activeCampaigns, completed: completedCampaigns },
      tasks: { pending: pendingTasks, overdue: overdueTasks, completionRate: taskCompletionRate },
    };
  }, [bookingsData, patientsData, pipelineData, stagesData, commsData, campaignsData, tasksData, range, period]);

  const isLoading = bookingsLoading || patientsLoading;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {t('analytics:statisticsTitle', { defaultValue: 'Statistics' })}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('analytics:statisticsSubtitle', { defaultValue: 'Performance overview across your practice' })}
          </p>
        </div>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList className="h-8">
            <TabsTrigger value="7d" className="text-xs px-3 h-7">7D</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs px-3 h-7">30D</TabsTrigger>
            <TabsTrigger value="90d" className="text-xs px-3 h-7">90D</TabsTrigger>
            <TabsTrigger value="12m" className="text-xs px-3 h-7">12M</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Hero KPIs — 4 big numbers at the top */}
      <MotionList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MotionItem>
          <div className="rounded-xl border border-border bg-card p-5">
            <BigNumber
              label={t('analytics:totalRevenue', { defaultValue: 'Revenue' })}
              value={metrics ? formatCurrency(metrics.revenue.current) : '—'}
              change={metrics?.revenue.change}
              sparkline={metrics?.revenue.sparkline}
              loading={isLoading}
            />
          </div>
        </MotionItem>
        <MotionItem>
          <div className="rounded-xl border border-border bg-card p-5">
            <BigNumber
              label={t('analytics:appointments', { defaultValue: 'Appointments' })}
              value={metrics ? String(metrics.appointments.current) : '—'}
              change={metrics?.appointments.change}
              sparkline={metrics?.appointments.sparkline}
              loading={isLoading}
            />
          </div>
        </MotionItem>
        <MotionItem>
          <div className="rounded-xl border border-border bg-card p-5">
            <BigNumber
              label={t('analytics:newPatientsLabel', { defaultValue: 'New Patients' })}
              value={metrics ? String(metrics.newPatients.current) : '—'}
              change={metrics?.newPatients.change}
              sparkline={metrics?.newPatients.sparkline}
              loading={isLoading}
            />
          </div>
        </MotionItem>
        <MotionItem>
          <div className="rounded-xl border border-border bg-card p-5">
            <BigNumber
              label={t('analytics:avgBookingValue', { defaultValue: 'Avg. Booking Value' })}
              value={metrics ? formatCurrency(metrics.avgValue.current) : '—'}
              change={metrics?.avgValue.change}
              loading={isLoading}
            />
          </div>
        </MotionItem>
      </MotionList>

      {/* Main Grid — 2 columns on desktop */}
      <MotionList className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3) */}
        <MotionItem className="lg:col-span-2 space-y-6">
          {/* Revenue by Day of Week — area chart */}
          <Section
            title={t('analytics:revenueByDay', { defaultValue: 'Revenue by Day of Week' })}
            subtitle={t('analytics:revenueByDayDesc', { defaultValue: 'Completed booking revenue distribution' })}
          >
            {metrics && (
              <div className="h-48 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.dayOfWeekRevenue} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <RechartsTooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>

          {/* Appointment Outcomes */}
          <Section
            title={t('analytics:appointmentOutcomes', { defaultValue: 'Appointment Outcomes' })}
          >
            {metrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {metrics.statusDistribution.map(item => (
                  <div key={item.label} className="text-center">
                    <div
                      className="text-2xl font-bold tabular-nums"
                      style={{ color: item.color }}
                    >
                      {item.value}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Performance Metrics — row list */}
          <Section
            title={t('analytics:performanceMetrics', { defaultValue: 'Performance Metrics' })}
          >
            {metrics && (
              <MotionList className="divide-y divide-border">
                <StatRow metric={{
                  label: t('analytics:completionRateLabel', { defaultValue: 'Completion Rate' }),
                  value: `${metrics.completionRate.current.toFixed(1)}%`,
                  change: metrics.completionRate.change,
                }} />
                <StatRow metric={{
                  label: t('analytics:noShowRateLabel', { defaultValue: 'No-show Rate' }),
                  value: `${metrics.noShowRate.current.toFixed(1)}%`,
                  change: metrics.noShowRate.change,
                }} />
                <StatRow metric={{
                  label: t('analytics:retentionRateLabel', { defaultValue: 'Patient Retention' }),
                  value: `${metrics.retentionRate.toFixed(1)}%`,
                }} />
                <StatRow metric={{
                  label: t('analytics:revenuePerAppointment', { defaultValue: 'Revenue / Appointment' }),
                  value: formatCurrency(metrics.appointments.current > 0
                    ? metrics.revenue.current / metrics.appointments.current
                    : 0),
                }} />
              </MotionList>
            )}
          </Section>

          {/* Communication Stats */}
          <Section
            title={t('analytics:communicationStats', { defaultValue: 'Communication Performance' })}
            subtitle={t('analytics:communicationStatsDesc', { defaultValue: 'Email engagement metrics' })}
          >
            {metrics && (
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-2xl font-bold text-foreground tabular-nums">
                    {metrics.comms.totalSent}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('analytics:emailsSent', { defaultValue: 'Emails Sent' })}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success tabular-nums">
                    {metrics.comms.openRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('analytics:clickRate', { defaultValue: 'Click Rate' })}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-destructive tabular-nums">
                    {metrics.comms.bounceRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('analytics:bounceRate', { defaultValue: 'Bounce Rate' })}
                  </div>
                </div>
              </div>
            )}
          </Section>
        </MotionItem>

        {/* Right column (1/3) */}
        <MotionItem className="space-y-6">
          {/* Pipeline Overview */}
          <Section
            title={t('analytics:pipelineOverview', { defaultValue: 'Pipeline' })}
            subtitle={`${metrics?.totalInPipeline || 0} ${t('analytics:totalInPipeline', { defaultValue: 'total patients' })}`}
          >
            {metrics && (
              <div className="space-y-3">
                {metrics.pipelineByStage.map(stage => (
                  <div key={stage.label} className="flex items-center gap-3">
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="text-xs text-muted-foreground flex-1 truncate">{stage.label}</span>
                    <span className="text-xs font-semibold text-foreground tabular-nums">{stage.value}</span>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/crm/pipeline')}
            >
              {t('common:actions.viewAll', { defaultValue: 'View pipeline' })}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Section>

          {/* Top Services */}
          <Section
            title={t('analytics:topServicesLabel', { defaultValue: 'Top Services' })}
            subtitle={t('analytics:topServicesDesc', { defaultValue: 'By completed appointments' })}
          >
            {metrics && <MiniBarChart data={metrics.topServices} />}
          </Section>

          {/* Revenue by Service */}
          <Section
            title={t('analytics:revenueByService', { defaultValue: 'Revenue by Service' })}
          >
            {metrics && (
              <MiniBarChart
                data={metrics.topRevenueServices}
                color="hsl(var(--chart-2))"
              />
            )}
          </Section>

          {/* Task Summary */}
          <Section
            title={t('analytics:taskSummary', { defaultValue: 'Tasks' })}
          >
            {metrics && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t('analytics:pendingTasks', { defaultValue: 'Pending' })}</span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">{metrics.tasks.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-destructive">{t('analytics:overdueTasks', { defaultValue: 'Overdue' })}</span>
                  <span className="text-sm font-semibold text-destructive tabular-nums">{metrics.tasks.overdue}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t('analytics:taskCompletionRate', { defaultValue: 'Completion rate' })}</span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">{metrics.tasks.completionRate.toFixed(0)}%</span>
                </div>
                {/* Mini progress bar */}
                <div className="h-1.5 bg-accent/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.tasks.completionRate}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-success"
                  />
                </div>
              </div>
            )}
          </Section>

          {/* Campaigns */}
          <Section
            title={t('analytics:campaignsOverview', { defaultValue: 'Campaigns' })}
          >
            {metrics && (
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-2xl font-bold text-foreground tabular-nums">{metrics.campaigns.active}</div>
                  <div className="text-xs text-muted-foreground">{t('analytics:activeCampaigns', { defaultValue: 'Active' })}</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <div className="text-2xl font-bold text-muted-foreground tabular-nums">{metrics.campaigns.completed}</div>
                  <div className="text-xs text-muted-foreground">{t('analytics:completedCampaigns', { defaultValue: 'Completed' })}</div>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/crm/campaigns')}
            >
              {t('analytics:manageCampaigns', { defaultValue: 'Manage campaigns' })}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Section>
        </MotionItem>
      </MotionList>
    </div>
  );
}
