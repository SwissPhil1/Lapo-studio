import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import { motion, MotionList, MotionItem, fadeIn } from '@/shared/components/motion';
import { BOOKING_STATUS } from '@/shared/lib/bookingStatus';
import { parseISO, isWithinInterval, differenceInDays } from 'date-fns';
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Zap,
  LineChart,
  Calculator,
  MessageSquare,
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

interface ReferralMetrics {
  revenue: number;
  prevRevenue: number;
  revenueChange: number;
  organicRevenue: number;
  revenueShare: number;
  totalReferrals: number;
  prevTotalReferrals: number;
  bookedReferrals: number;
  confirmedReferrals: number;
  conversionRate: number;
  commissionsPaid: number;
  roi: number;
  activeReferrers: number;
  dormantReferrers: number;
  coldReferrers: number;
  totalReferrers: number;
  referredRetentionRate: number;
  firstPurchase: number;
  repeatPurchase: number;
}

interface Metrics {
  revenue: { current: number; prev: number };
  appointments: { current: number; prev: number };
  newPatients: { current: number; prev: number };
  avgValue: { current: number; prev: number };
  retentionRate: number;
  comms: { totalSent: number; openRate: number; bounceRate: number };
  campaigns: { active: number; completed: number };
  tasks: { pending: number; overdue: number; completionRate: number };
  referral: ReferralMetrics;
}

interface BookingRow {
  id: string;
  booking_date: string;
  booking_value: number | null;
  status: string;
  referrer_code?: string | null;
  patient_id: string;
  service?: string | null;
  is_test: boolean;
}

interface ReferrerPerfRow {
  referrer_id: string;
  referrer_code: string | null;
  total_referrals: number;
  booked_referrals: number;
  confirmed_referrals: number;
  total_commissions: number;
  last_referral_at: string | null;
}

interface CommissionRow {
  id: string;
  commission_amount: number | null;
  purchase_amount: number | null;
  purchase_type: string | null;
  status: string | null;
  created_at: string;
  referrer_id: string;
  is_test: boolean;
}

interface ReferralRow {
  id: string;
  referral_status: string;
  referrer_id: string;
  referred_patient_id: string;
  created_at: string;
  is_test: boolean;
}

interface CommsRow {
  id: string;
  status: string | null;
  sent_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  channel: string | null;
}

interface PatientRow {
  id: string;
  created_at: string | null;
  is_test: boolean;
}

export interface ExecutiveBusinessCaseProps {
  metrics: Metrics;
  range: DateRange;
  period: string;
  bookingsData: BookingRow[];
  referredBookingsData: BookingRow[];
  referrerPerfData: ReferrerPerfRow[];
  commissionsData: CommissionRow[];
  referralsData: ReferralRow[];
  commsData: CommsRow[];
  patientsData: PatientRow[];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Section({ title, subtitle, icon: Icon, children, className }: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeIn}
      className={cn('rounded-xl border border-border bg-card p-6', className)}
    >
      <div className="mb-4 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function MetricRow({ label, value, highlight }: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn(
        'text-sm font-semibold tabular-nums',
        highlight ? 'text-primary' : 'text-foreground'
      )}>{value}</span>
    </div>
  );
}

function ProgressBar({ value, max, color = 'bg-primary' }: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 bg-accent/30 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={cn('h-full rounded-full', color)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ExecutiveBusinessCase({
  metrics,
  range,
  period,
  bookingsData,
  referredBookingsData,
  referrerPerfData,
  commissionsData,
  referralsData,
  commsData,
  patientsData,
}: ExecutiveBusinessCaseProps) {
  const { t } = useTranslation(['analytics', 'common']);

  // Configurable inputs
  const [appMonthlyCost, setAppMonthlyCost] = useState(299);
  const [benchmarkCAC, setBenchmarkCAC] = useState(150);

  // -------------------------------------------------------------------------
  // Executive Metrics Computation
  // -------------------------------------------------------------------------

  const exec = useMemo(() => {
    const periodDays = differenceInDays(range.end, range.start) || 1;
    const periodMonths = Math.max(periodDays / 30, 1);

    // --- 1. App ROI & Payback ---
    const totalAppCost = appMonthlyCost * periodMonths;
    const refRevenue = metrics.referral.revenue;
    const commPaid = metrics.referral.commissionsPaid;
    const netProfit = refRevenue - commPaid - totalAppCost;
    const appROI = totalAppCost > 0 ? refRevenue / totalAppCost : 0;
    const dailyRefRevenue = refRevenue / periodDays;
    const dailyAppCost = appMonthlyCost / 30;
    const paybackDays = dailyRefRevenue > dailyAppCost
      ? Math.ceil(totalAppCost / (dailyRefRevenue - (commPaid / periodDays)))
      : Infinity;

    // --- 2. CAC Comparison ---
    const referredPatientIds = new Set(
      referredBookingsData
        .filter(b => isWithinInterval(parseISO(b.booking_date), { start: range.start, end: range.end }))
        .map(b => b.patient_id)
    );
    const newReferredPatients = referredPatientIds.size;
    const referralCAC = newReferredPatients > 0 ? commPaid / newReferredPatients : 0;
    const cacSavingsPerPatient = benchmarkCAC - referralCAC;
    const totalCACSavings = cacSavingsPerPatient * newReferredPatients;

    // --- 3. LTV Differential ---
    const referredPids = new Set(referredBookingsData.map(b => b.patient_id));
    const allCompletedBookings = bookingsData.filter(b => b.status === BOOKING_STATUS.COMPLETED);

    const referredBookings = allCompletedBookings.filter(b => referredPids.has(b.patient_id));
    const organicBookings = allCompletedBookings.filter(b => !referredPids.has(b.patient_id));

    const referredPatientBookings: Record<string, { total: number; count: number }> = {};
    referredBookings.forEach(b => {
      if (!referredPatientBookings[b.patient_id]) referredPatientBookings[b.patient_id] = { total: 0, count: 0 };
      referredPatientBookings[b.patient_id].total += b.booking_value || 0;
      referredPatientBookings[b.patient_id].count += 1;
    });
    const organicPatientBookings: Record<string, { total: number; count: number }> = {};
    organicBookings.forEach(b => {
      if (!organicPatientBookings[b.patient_id]) organicPatientBookings[b.patient_id] = { total: 0, count: 0 };
      organicPatientBookings[b.patient_id].total += b.booking_value || 0;
      organicPatientBookings[b.patient_id].count += 1;
    });

    const referredPatientsArr = Object.values(referredPatientBookings);
    const organicPatientsArr = Object.values(organicPatientBookings);

    const referredAvgSpend = referredPatientsArr.length > 0
      ? referredPatientsArr.reduce((s, p) => s + p.total, 0) / referredPatientsArr.length : 0;
    const organicAvgSpend = organicPatientsArr.length > 0
      ? organicPatientsArr.reduce((s, p) => s + p.total, 0) / organicPatientsArr.length : 0;
    const referredAvgVisits = referredPatientsArr.length > 0
      ? referredPatientsArr.reduce((s, p) => s + p.count, 0) / referredPatientsArr.length : 0;
    const organicAvgVisits = organicPatientsArr.length > 0
      ? organicPatientsArr.reduce((s, p) => s + p.count, 0) / organicPatientsArr.length : 0;

    const referredLTV = referredAvgSpend;
    const organicLTV = organicAvgSpend;
    const ltvUplift = organicLTV > 0 ? ((referredLTV - organicLTV) / organicLTV) * 100 : 0;
    const ltvCacRatio = referralCAC > 0 ? referredLTV / referralCAC : 0;

    // --- 4. Revenue Growth Attribution ---
    const prevRevenue = metrics.revenue.prev;
    const curRevenue = metrics.revenue.current;
    const revenueGrowth = prevRevenue > 0 ? ((curRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const growthAmount = curRevenue - prevRevenue;
    const refGrowthAmount = refRevenue - metrics.referral.prevRevenue;
    const growthAttribution = growthAmount > 0 ? (refGrowthAmount / growthAmount) * 100 : 0;
    const revenueWithoutReferrals = curRevenue - refRevenue;

    // --- 5. Network Effects & Virality ---
    const avgReferralsPerReferrer = metrics.referral.totalReferrers > 0
      ? metrics.referral.totalReferrals / metrics.referral.totalReferrers : 0;
    const kFactor = avgReferralsPerReferrer * (metrics.referral.conversionRate / 100);

    // New referrers per month (those created in the period)
    const newReferrersInPeriod = referrerPerfData.filter(r => {
      if (!r.last_referral_at) return false;
      return isWithinInterval(parseISO(r.last_referral_at), { start: range.start, end: range.end });
    }).length;
    const newReferrersPerMonth = newReferrersInPeriod / periodMonths;

    // Avg days to first referral (from referrer creation to first referral)
    const referrerFirstReferralDays = referralsData
      .filter(r => r.created_at && isWithinInterval(parseISO(r.created_at), { start: range.start, end: range.end }))
      .reduce((acc, r) => {
        const refPerf = referrerPerfData.find(rp => rp.referrer_id === r.referrer_id);
        if (refPerf?.last_referral_at) {
          acc.push(Math.abs(differenceInDays(parseISO(r.created_at), parseISO(refPerf.last_referral_at))));
        }
        return acc;
      }, [] as number[]);
    const avgDaysToFirstReferral = referrerFirstReferralDays.length > 0
      ? referrerFirstReferralDays.reduce((s, d) => s + d, 0) / referrerFirstReferralDays.length : 0;

    // --- 6. Commission Efficiency ---
    const effectiveCommissionRate = refRevenue > 0 ? (commPaid / refRevenue) * 100 : 0;
    const revenueMultiplier = commPaid > 0 ? refRevenue / commPaid : 0;

    // Monthly commission trend (group commissions by month-like buckets)
    const commissionsByBucket: Record<string, { commission: number; revenue: number }> = {};
    commissionsData
      .filter(c => c.created_at && isWithinInterval(parseISO(c.created_at), { start: range.start, end: range.end }))
      .forEach(c => {
        const month = c.created_at.slice(0, 7); // YYYY-MM
        if (!commissionsByBucket[month]) commissionsByBucket[month] = { commission: 0, revenue: 0 };
        commissionsByBucket[month].commission += c.commission_amount || 0;
        commissionsByBucket[month].revenue += c.purchase_amount || 0;
      });
    const commissionTrend = Object.entries(commissionsByBucket)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: month.slice(5), // MM
        commission: Math.round(data.commission),
        revenue: Math.round(data.revenue),
        rate: data.revenue > 0 ? ((data.commission / data.revenue) * 100) : 0,
      }));

    // --- 7. 12-Month Projection ---
    const monthlyRefRevenue = refRevenue / periodMonths;
    const monthlyGrowthRate = revenueGrowth > 0 ? revenueGrowth / 100 : 0.05; // fallback 5%
    const projection12m = Array.from({ length: 12 }, (_, i) => {
      const projectedRevenue = monthlyRefRevenue * Math.pow(1 + monthlyGrowthRate / 12, i + 1);
      const projectedCommission = projectedRevenue * (effectiveCommissionRate / 100);
      const projectedNet = projectedRevenue - projectedCommission - appMonthlyCost;
      return {
        month: `M${i + 1}`,
        revenue: Math.round(projectedRevenue),
        net: Math.round(projectedNet),
        cumulative: 0, // filled below
      };
    });
    let cumulative = 0;
    projection12m.forEach(m => {
      cumulative += m.net;
      m.cumulative = Math.round(cumulative);
    });
    const projected12mRevenue = projection12m.reduce((s, m) => s + m.revenue, 0);
    const projected12mNet = projection12m[11]?.cumulative || 0;

    // --- 8. CRM Value Add ---
    const currentComms = commsData.filter(c =>
      c.sent_at && isWithinInterval(parseISO(c.sent_at), { start: range.start, end: range.end })
    );
    const totalSent = currentComms.length;
    const totalClicked = currentComms.filter(c => c.clicked_at).length;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;

    const reactivationRate = metrics.tasks.completionRate;
    const pipelineValue = allCompletedBookings.length > 0
      ? (allCompletedBookings.reduce((s, b) => s + (b.booking_value || 0), 0) / allCompletedBookings.length) * metrics.appointments.current
      : 0;

    // --- 9. Scenario Modeling (Bull / Base / Bear) ---
    const baseGrowth = monthlyGrowthRate;
    const scenarios = (['bear', 'base', 'bull'] as const).map(scenario => {
      const growthMultiplier = scenario === 'bull' ? 1.5 : scenario === 'bear' ? 0.4 : 1;
      const growth = baseGrowth * growthMultiplier;
      let cum = 0;
      const months = Array.from({ length: 12 }, (_, i) => {
        const rev = monthlyRefRevenue * Math.pow(1 + growth / 12, i + 1);
        const comm = rev * (effectiveCommissionRate / 100);
        const net = rev - comm - appMonthlyCost;
        cum += net;
        return { month: `M${i + 1}`, revenue: Math.round(rev), net: Math.round(net), cumulative: Math.round(cum) };
      });
      return {
        scenario,
        growthRate: growth * 100,
        year1Revenue: months.reduce((s, m) => s + m.revenue, 0),
        year1Net: months[11]?.cumulative || 0,
        months,
      };
    });

    // --- 10. Industry Benchmarks ---
    const benchmarks = {
      avgClinicCAC: benchmarkCAC,
      avgClinicLTV: 800, // CHF — typical aesthetic clinic
      avgRetentionRate: 35, // %
      avgReferralShare: 15, // % of revenue from referrals
      avgCommissionRate: 10, // %
    };

    return {
      // 1. ROI & Payback
      totalAppCost,
      netProfit,
      appROI,
      paybackDays,
      dailyRefRevenue,
      // 2. CAC
      newReferredPatients,
      referralCAC,
      cacSavingsPerPatient,
      totalCACSavings,
      // 3. LTV
      referredLTV,
      organicLTV,
      referredAvgVisits,
      organicAvgVisits,
      ltvUplift,
      ltvCacRatio,
      // 4. Growth Attribution
      revenueGrowth,
      growthAmount,
      growthAttribution,
      revenueWithoutReferrals,
      // 5. Network & Virality
      avgReferralsPerReferrer,
      kFactor,
      newReferrersPerMonth,
      avgDaysToFirstReferral,
      // 6. Commission Efficiency
      effectiveCommissionRate,
      revenueMultiplier,
      commissionTrend,
      // 7. Projection
      projection12m,
      projected12mRevenue,
      projected12mNet,
      monthlyRefRevenue,
      // 8. CRM Value
      clickRate,
      reactivationRate,
      pipelineValue,
      totalSent,
      totalClicked,
      // 9. Scenarios
      scenarios,
      // 10. Benchmarks
      benchmarks,
    };
  }, [metrics, range, period, appMonthlyCost, benchmarkCAC, bookingsData, referredBookingsData, referrerPerfData, commissionsData, referralsData, commsData, patientsData]);

  return (
    <div className="space-y-6">
      {/* Configurable Assumptions */}
      <MotionList className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MotionItem>
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-4">
            <Label className="text-xs text-muted-foreground">
              {t('analytics:exec.appMonthlyCost', { defaultValue: 'Monthly App Cost (CHF)' })}
            </Label>
            <Input
              type="number"
              value={appMonthlyCost}
              onChange={e => setAppMonthlyCost(Number(e.target.value) || 0)}
              className="mt-1.5 h-8 text-sm tabular-nums"
            />
          </div>
        </MotionItem>
        <MotionItem>
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-4">
            <Label className="text-xs text-muted-foreground">
              {t('analytics:exec.benchmarkCAC', { defaultValue: 'Industry Benchmark CAC (CHF)' })}
            </Label>
            <Input
              type="number"
              value={benchmarkCAC}
              onChange={e => setBenchmarkCAC(Number(e.target.value) || 0)}
              className="mt-1.5 h-8 text-sm tabular-nums"
            />
          </div>
        </MotionItem>
      </MotionList>

      {/* Hero KPIs — 5 key numbers at a glance */}
      <MotionList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          {
            label: t('analytics:exec.heroROI', { defaultValue: 'App ROI' }),
            value: `${exec.appROI.toFixed(1)}x`,
            sub: t('analytics:exec.heroROISub', { defaultValue: 'return on app cost' }),
            highlight: exec.appROI > 1,
          },
          {
            label: t('analytics:exec.heroKFactor', { defaultValue: 'Viral Coefficient' }),
            value: exec.kFactor.toFixed(2),
            sub: exec.kFactor >= 1
              ? t('analytics:exec.kSelfSustaining', { defaultValue: 'Self-sustaining' })
              : t('analytics:exec.kGrowing', { defaultValue: 'Growing' }),
            highlight: exec.kFactor >= 1,
          },
          {
            label: t('analytics:exec.heroLTVCAC', { defaultValue: 'LTV:CAC' }),
            value: exec.ltvCacRatio > 0 ? `${exec.ltvCacRatio.toFixed(1)}x` : '—',
            sub: t('analytics:exec.heroLTVCACSub', { defaultValue: 'referred patients' }),
            highlight: exec.ltvCacRatio >= 3,
          },
          {
            label: t('analytics:exec.heroPayback', { defaultValue: 'Payback' }),
            value: exec.paybackDays === Infinity ? '—' : `${exec.paybackDays}d`,
            sub: t('analytics:exec.heroPaybackSub', { defaultValue: 'to break even' }),
            highlight: exec.paybackDays < 90,
          },
          {
            label: t('analytics:exec.heroNetProfit', { defaultValue: 'Net Profit' }),
            value: formatCurrency(exec.netProfit),
            sub: t('analytics:exec.heroNetProfitSub', { defaultValue: 'after all costs' }),
            highlight: exec.netProfit > 0,
          },
        ].map((kpi) => (
          <MotionItem key={kpi.label}>
            <div className={cn(
              'rounded-xl border p-4 text-center',
              kpi.highlight ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
            )}>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{kpi.label}</div>
              <div className={cn(
                'text-xl font-bold tabular-nums',
                kpi.highlight ? 'text-primary' : 'text-foreground'
              )}>{kpi.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</div>
            </div>
          </MotionItem>
        ))}
      </MotionList>

      {/* Sections 1-3 */}
      <MotionList className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. App ROI & Payback */}
        <MotionItem>
          <Section
            title={t('analytics:exec.roiTitle', { defaultValue: 'App ROI & Payback' })}
            subtitle={t('analytics:exec.roiSubtitle', { defaultValue: 'Is the app paying for itself?' })}
            icon={DollarSign}
          >
            <div className="space-y-1 divide-y divide-border">
              <MetricRow
                label={t('analytics:exec.appCostPeriod', { defaultValue: 'App cost (period)' })}
                value={formatCurrency(exec.totalAppCost)}
              />
              <MetricRow
                label={t('analytics:exec.referralRevenue', { defaultValue: 'Referral revenue' })}
                value={formatCurrency(metrics.referral.revenue)}
              />
              <MetricRow
                label={t('analytics:exec.commissionsPaid', { defaultValue: 'Commissions paid' })}
                value={formatCurrency(metrics.referral.commissionsPaid)}
              />
              <MetricRow
                label={t('analytics:exec.netProfit', { defaultValue: 'Net profit' })}
                value={formatCurrency(exec.netProfit)}
                highlight={exec.netProfit > 0}
              />
              <MetricRow
                label={t('analytics:exec.roiMultiplier', { defaultValue: 'ROI multiplier' })}
                value={`${exec.appROI.toFixed(1)}x`}
                highlight
              />
              <MetricRow
                label={t('analytics:exec.paybackPeriod', { defaultValue: 'Payback period' })}
                value={exec.paybackDays === Infinity
                  ? t('analytics:exec.notYet', { defaultValue: 'Not yet' })
                  : `${exec.paybackDays} ${t('analytics:exec.days', { defaultValue: 'days' })}`}
              />
            </div>

            {/* Break-even visual */}
            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                {t('analytics:exec.breakEven', { defaultValue: 'Break-even Progress' })}
              </div>
              <ProgressBar
                value={metrics.referral.revenue}
                max={exec.totalAppCost + metrics.referral.commissionsPaid}
                color={exec.netProfit > 0 ? 'bg-success' : 'bg-warning'}
              />
              <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                <span>{t('analytics:exec.costs', { defaultValue: 'Costs' })}</span>
                <span>{exec.netProfit > 0
                  ? t('analytics:exec.profitable', { defaultValue: 'Profitable' })
                  : t('analytics:exec.notBreakEven', { defaultValue: 'Not yet break-even' })}</span>
              </div>
            </div>
          </Section>
        </MotionItem>

        {/* 2. CAC Comparison */}
        <MotionItem>
          <Section
            title={t('analytics:exec.cacTitle', { defaultValue: 'Acquisition Cost (CAC)' })}
            subtitle={t('analytics:exec.cacSubtitle', { defaultValue: 'Referral vs industry benchmark' })}
            icon={Target}
          >
            <div className="space-y-1 divide-y divide-border">
              <MetricRow
                label={t('analytics:exec.referralCAC', { defaultValue: 'Referral CAC' })}
                value={exec.newReferredPatients > 0 ? formatCurrency(exec.referralCAC) : '—'}
                highlight
              />
              <MetricRow
                label={t('analytics:exec.industryCAC', { defaultValue: 'Industry benchmark' })}
                value={formatCurrency(benchmarkCAC)}
              />
              <MetricRow
                label={t('analytics:exec.savingsPerPatient', { defaultValue: 'Savings per patient' })}
                value={exec.cacSavingsPerPatient > 0
                  ? formatCurrency(exec.cacSavingsPerPatient)
                  : formatCurrency(exec.cacSavingsPerPatient)}
                highlight={exec.cacSavingsPerPatient > 0}
              />
              <MetricRow
                label={t('analytics:exec.newReferredPatients', { defaultValue: 'New referred patients' })}
                value={String(exec.newReferredPatients)}
              />
              <MetricRow
                label={t('analytics:exec.totalCACSavings', { defaultValue: 'Total CAC savings' })}
                value={formatCurrency(exec.totalCACSavings)}
                highlight={exec.totalCACSavings > 0}
              />
            </div>

            {/* CAC comparison bar */}
            <div className="mt-4 pt-3 border-t border-border space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground w-16 shrink-0">
                  {t('analytics:exec.referral', { defaultValue: 'Referral' })}
                </span>
                <div className="flex-1">
                  <ProgressBar value={exec.referralCAC} max={benchmarkCAC} color="bg-primary" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground w-16 shrink-0">
                  {t('analytics:exec.benchmark', { defaultValue: 'Benchmark' })}
                </span>
                <div className="flex-1">
                  <ProgressBar value={benchmarkCAC} max={benchmarkCAC} color="bg-muted-foreground/40" />
                </div>
              </div>
            </div>
          </Section>
        </MotionItem>

        {/* 3. LTV Differential */}
        <MotionItem>
          <Section
            title={t('analytics:exec.ltvTitle', { defaultValue: 'Lifetime Value (LTV)' })}
            subtitle={t('analytics:exec.ltvSubtitle', { defaultValue: 'Referred vs organic patients' })}
            icon={Users}
          >
            <div className="space-y-1 divide-y divide-border">
              <MetricRow
                label={t('analytics:exec.referredLTV', { defaultValue: 'Referred patient LTV' })}
                value={formatCurrency(exec.referredLTV)}
                highlight
              />
              <MetricRow
                label={t('analytics:exec.organicLTV', { defaultValue: 'Organic patient LTV' })}
                value={formatCurrency(exec.organicLTV)}
              />
              <MetricRow
                label={t('analytics:exec.ltvUplift', { defaultValue: 'LTV uplift' })}
                value={`${exec.ltvUplift > 0 ? '+' : ''}${exec.ltvUplift.toFixed(1)}%`}
                highlight={exec.ltvUplift > 0}
              />
              <MetricRow
                label={t('analytics:exec.referredVisits', { defaultValue: 'Avg visits (referred)' })}
                value={exec.referredAvgVisits.toFixed(1)}
              />
              <MetricRow
                label={t('analytics:exec.organicVisits', { defaultValue: 'Avg visits (organic)' })}
                value={exec.organicAvgVisits.toFixed(1)}
              />
              <MetricRow
                label={t('analytics:exec.ltvCacRatio', { defaultValue: 'LTV:CAC ratio' })}
                value={exec.ltvCacRatio > 0 ? `${exec.ltvCacRatio.toFixed(1)}x` : '—'}
                highlight
              />
            </div>

            {/* LTV comparison visual */}
            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                {t('analytics:exec.ltvComparison', { defaultValue: 'LTV Comparison' })}
              </div>
              <div className="flex gap-2 h-8">
                <div className="flex-1 flex flex-col justify-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.min((exec.referredLTV / Math.max(exec.referredLTV, exec.organicLTV, 1)) * 100, 100)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="bg-primary rounded-t-sm w-full"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.min((exec.organicLTV / Math.max(exec.referredLTV, exec.organicLTV, 1)) * 100, 100)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                    className="bg-accent w-full rounded-t-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <span className="flex-1 text-center text-[10px] text-muted-foreground">
                  {t('analytics:exec.referred', { defaultValue: 'Referred' })}
                </span>
                <span className="flex-1 text-center text-[10px] text-muted-foreground">
                  {t('analytics:exec.organic', { defaultValue: 'Organic' })}
                </span>
              </div>
            </div>
          </Section>
        </MotionItem>
      </MotionList>

      {/* Sections 4-6 */}
      <MotionList className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 4. Revenue Growth Attribution */}
        <MotionItem>
          <Section
            title={t('analytics:exec.growthTitle', { defaultValue: 'Revenue Growth Attribution' })}
            subtitle={t('analytics:exec.growthSubtitle', { defaultValue: 'What drives your growth?' })}
            icon={TrendingUp}
          >
            <div className="space-y-1 divide-y divide-border">
              <MetricRow
                label={t('analytics:exec.revenueGrowth', { defaultValue: 'Revenue growth (MoM)' })}
                value={`${exec.revenueGrowth > 0 ? '+' : ''}${exec.revenueGrowth.toFixed(1)}%`}
                highlight={exec.revenueGrowth > 0}
              />
              <MetricRow
                label={t('analytics:exec.growthAmount', { defaultValue: 'Growth amount' })}
                value={formatCurrency(exec.growthAmount)}
              />
              <MetricRow
                label={t('analytics:exec.referralAttribution', { defaultValue: 'From referrals' })}
                value={`${exec.growthAttribution.toFixed(0)}%`}
                highlight
              />
              <MetricRow
                label={t('analytics:exec.revenueWithout', { defaultValue: 'Revenue without referrals' })}
                value={formatCurrency(exec.revenueWithoutReferrals)}
              />
            </div>

            {/* Attribution split bar */}
            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                {t('analytics:exec.growthSources', { defaultValue: 'Growth Sources' })}
              </div>
              {exec.growthAmount > 0 ? (
                <>
                  <div className="flex gap-1 h-5 rounded-md overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(exec.growthAttribution, 100)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="bg-primary rounded-sm flex items-center justify-center"
                    >
                      {exec.growthAttribution > 20 && (
                        <span className="text-[9px] font-bold text-primary-foreground">{exec.growthAttribution.toFixed(0)}%</span>
                      )}
                    </motion.div>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(100 - exec.growthAttribution, 0)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                      className="bg-accent rounded-sm flex items-center justify-center"
                    >
                      {exec.growthAttribution < 80 && (
                        <span className="text-[9px] font-medium text-muted-foreground">{(100 - exec.growthAttribution).toFixed(0)}%</span>
                      )}
                    </motion.div>
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="text-[10px] text-muted-foreground">{t('analytics:exec.referralDriven', { defaultValue: 'Referral-driven' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      <span className="text-[10px] text-muted-foreground">{t('analytics:exec.organicGrowth', { defaultValue: 'Organic' })}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t('analytics:exec.noGrowthData', { defaultValue: 'Not enough data for attribution' })}
                </p>
              )}
            </div>
          </Section>
        </MotionItem>

        {/* 5. Network Effects & Virality */}
        <MotionItem>
          <Section
            title={t('analytics:exec.networkTitle', { defaultValue: 'Network Effects & Virality' })}
            subtitle={t('analytics:exec.networkSubtitle', { defaultValue: 'Is the referral network self-sustaining?' })}
            icon={Zap}
          >
            <div className="space-y-1 divide-y divide-border">
              <MetricRow
                label={t('analytics:exec.kFactor', { defaultValue: 'Viral coefficient (K)' })}
                value={exec.kFactor.toFixed(2)}
                highlight={exec.kFactor >= 1}
              />
              <MetricRow
                label={t('analytics:exec.avgReferrals', { defaultValue: 'Avg referrals / referrer' })}
                value={exec.avgReferralsPerReferrer.toFixed(1)}
              />
              <MetricRow
                label={t('analytics:exec.conversionRate', { defaultValue: 'Conversion rate' })}
                value={`${metrics.referral.conversionRate.toFixed(1)}%`}
              />
              <MetricRow
                label={t('analytics:exec.newReferrersMonth', { defaultValue: 'New referrers / month' })}
                value={exec.newReferrersPerMonth.toFixed(1)}
              />
              <MetricRow
                label={t('analytics:exec.daysToFirst', { defaultValue: 'Avg days to 1st referral' })}
                value={exec.avgDaysToFirstReferral > 0 ? `${exec.avgDaysToFirstReferral.toFixed(0)}d` : '—'}
              />
            </div>

            {/* K-factor gauge */}
            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                {t('analytics:exec.viralHealth', { defaultValue: 'Viral Health' })}
              </div>
              <div className="relative">
                <ProgressBar
                  value={exec.kFactor}
                  max={2}
                  color={exec.kFactor >= 1 ? 'bg-success' : exec.kFactor >= 0.5 ? 'bg-warning' : 'bg-destructive'}
                />
                {/* Threshold marker at K=1 */}
                <div className="absolute top-0 h-2 w-px bg-foreground/50" style={{ left: '50%' }} />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                <span>K=0</span>
                <span className="font-medium">{t('analytics:exec.viralThreshold', { defaultValue: 'K=1 (viral)' })}</span>
                <span>K=2</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                {exec.kFactor >= 1
                  ? t('analytics:exec.viralGood', { defaultValue: 'Network is self-sustaining — each referrer generates 1+ new patients who become referrers.' })
                  : t('analytics:exec.viralGrowing', { defaultValue: 'Network is growing but not yet self-sustaining. Focus on increasing referrals per referrer or conversion rate.' })}
              </p>
            </div>
          </Section>
        </MotionItem>

        {/* 6. Commission Efficiency */}
        <MotionItem>
          <Section
            title={t('analytics:exec.commissionTitle', { defaultValue: 'Commission Efficiency' })}
            subtitle={t('analytics:exec.commissionSubtitle', { defaultValue: 'Revenue per CHF of commission' })}
            icon={Calculator}
          >
            <div className="space-y-1 divide-y divide-border">
              <MetricRow
                label={t('analytics:exec.effectiveRate', { defaultValue: 'Effective commission rate' })}
                value={`${exec.effectiveCommissionRate.toFixed(1)}%`}
              />
              <MetricRow
                label={t('analytics:exec.revenueMultiplier', { defaultValue: 'Revenue multiplier' })}
                value={`${exec.revenueMultiplier.toFixed(1)}x`}
                highlight
              />
              <MetricRow
                label={t('analytics:exec.totalCommissions', { defaultValue: 'Total commissions' })}
                value={formatCurrency(metrics.referral.commissionsPaid)}
              />
              <MetricRow
                label={t('analytics:exec.totalRefRevenue', { defaultValue: 'Total referral revenue' })}
                value={formatCurrency(metrics.referral.revenue)}
              />
            </div>

            {/* Commission trend chart */}
            {exec.commissionTrend.length > 1 && (
              <div className="mt-4 pt-3 border-t border-border">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                  {t('analytics:exec.commissionTrend', { defaultValue: 'Commission Rate Trend' })}
                </div>
                <div className="h-32 -mx-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={exec.commissionTrend} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <RechartsTooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                        formatter={(value, name) => {
                          const v = Number(value);
                          return [
                            name === 'rate' ? `${v.toFixed(1)}%` : formatCurrency(v),
                            name === 'rate'
                              ? t('analytics:exec.rateLabel', { defaultValue: 'Rate' })
                              : name === 'commission'
                                ? t('analytics:exec.commLabel', { defaultValue: 'Commission' })
                                : t('analytics:exec.revLabel', { defaultValue: 'Revenue' }),
                          ];
                        }}
                      />
                      <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground mt-3">
              {t('analytics:exec.commissionInsight', {
                defaultValue: 'Every CHF 1 in commission generates CHF {{multiplier}} in revenue.',
                multiplier: exec.revenueMultiplier.toFixed(1),
              })}
            </p>
          </Section>
        </MotionItem>
      </MotionList>

      {/* Sections 7-8 */}
      <MotionList className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 7. 12-Month Projection */}
        <MotionItem>
          <Section
            title={t('analytics:exec.projectionTitle', { defaultValue: '12-Month Forward Projection' })}
            subtitle={t('analytics:exec.projectionSubtitle', { defaultValue: 'Based on current growth trends' })}
            icon={LineChart}
            className="lg:col-span-1"
          >
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-foreground tabular-nums">
                  {formatCurrency(exec.projected12mRevenue)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {t('analytics:exec.projectedRevenue', { defaultValue: 'Projected revenue' })}
                </div>
              </div>
              <div className="text-center">
                <div className={cn('text-lg font-bold tabular-nums', exec.projected12mNet > 0 ? 'text-success' : 'text-destructive')}>
                  {formatCurrency(exec.projected12mNet)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {t('analytics:exec.cumulativeNet', { defaultValue: 'Cumulative net' })}
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-foreground tabular-nums">
                  {formatCurrency(exec.monthlyRefRevenue)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {t('analytics:exec.currentMonthly', { defaultValue: 'Current monthly' })}
                </div>
              </div>
            </div>

            {/* Projection chart */}
            <div className="h-44 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={exec.projection12m} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <RechartsTooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    formatter={(value, name) => [
                      formatCurrency(Number(value)),
                      name === 'revenue'
                        ? t('analytics:exec.projRevLabel', { defaultValue: 'Revenue' })
                        : name === 'net'
                          ? t('analytics:exec.projNetLabel', { defaultValue: 'Net' })
                          : t('analytics:exec.projCumLabel', { defaultValue: 'Cumulative' }),
                    ]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cumulative" stroke="hsl(var(--success))" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 bg-primary rounded" />
                <span className="text-[10px] text-muted-foreground">{t('analytics:exec.monthlyRevenue', { defaultValue: 'Monthly revenue' })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 bg-success rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, hsl(var(--card)) 2px, hsl(var(--card)) 4px)' }} />
                <span className="text-[10px] text-muted-foreground">{t('analytics:exec.cumulativeNetLabel', { defaultValue: 'Cumulative net profit' })}</span>
              </div>
            </div>
          </Section>
        </MotionItem>

        {/* 8. CRM Value Add */}
        <MotionItem>
          <Section
            title={t('analytics:exec.crmTitle', { defaultValue: 'CRM Value Add' })}
            subtitle={t('analytics:exec.crmSubtitle', { defaultValue: 'Beyond referrals — what the CRM delivers' })}
            icon={MessageSquare}
          >
            <div className="space-y-1 divide-y divide-border">
              <MetricRow
                label={t('analytics:exec.emailsSent', { defaultValue: 'Communications sent' })}
                value={String(exec.totalSent)}
              />
              <MetricRow
                label={t('analytics:exec.clickRate', { defaultValue: 'Click-through rate' })}
                value={`${exec.clickRate.toFixed(1)}%`}
              />
              <MetricRow
                label={t('analytics:exec.taskCompletion', { defaultValue: 'Task completion rate' })}
                value={`${exec.reactivationRate.toFixed(0)}%`}
              />
              <MetricRow
                label={t('analytics:exec.activeCampaigns', { defaultValue: 'Active campaigns' })}
                value={String(metrics.campaigns.active)}
              />
              <MetricRow
                label={t('analytics:exec.completedCampaigns', { defaultValue: 'Completed campaigns' })}
                value={String(metrics.campaigns.completed)}
              />
            </div>

            {/* CRM impact summary */}
            <div className="mt-4 pt-3 border-t border-border space-y-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                {t('analytics:exec.crmImpact', { defaultValue: 'Operational Impact' })}
              </div>
              {[
                {
                  label: t('analytics:exec.impactPipeline', { defaultValue: 'Pipeline management' }),
                  active: true,
                },
                {
                  label: t('analytics:exec.impactAutomation', { defaultValue: 'Workflow automation' }),
                  active: metrics.tasks.completionRate > 0,
                },
                {
                  label: t('analytics:exec.impactComms', { defaultValue: 'Multi-channel communications' }),
                  active: exec.totalSent > 0,
                },
                {
                  label: t('analytics:exec.impactAnalytics', { defaultValue: 'Advanced analytics & reporting' }),
                  active: true,
                },
                {
                  label: t('analytics:exec.impactRetention', { defaultValue: 'Patient retention tracking' }),
                  active: true,
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={cn(
                    'h-2 w-2 rounded-full shrink-0',
                    item.active ? 'bg-success' : 'bg-muted-foreground/30'
                  )} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground mt-4 pt-3 border-t border-border">
              {t('analytics:exec.crmInsight', {
                defaultValue: 'The CRM consolidates patient management, communications, and analytics into a single platform — reducing operational overhead and enabling data-driven decisions.',
              })}
            </p>
          </Section>
        </MotionItem>
      </MotionList>

      {/* Section 9: Scenario Modeling */}
      <MotionList className="grid grid-cols-1 gap-6">
        <MotionItem>
          <Section
            title={t('analytics:exec.scenarioTitle', { defaultValue: 'Scenario Modeling — 12-Month Outlook' })}
            subtitle={t('analytics:exec.scenarioSubtitle', { defaultValue: 'Bull / Base / Bear projections based on current trends' })}
            icon={TrendingUp}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {exec.scenarios.map((s) => {
                const isBull = s.scenario === 'bull';
                const isBear = s.scenario === 'bear';
                const label = isBull
                  ? t('analytics:exec.bull', { defaultValue: 'Bull Case' })
                  : isBear
                    ? t('analytics:exec.bear', { defaultValue: 'Bear Case' })
                    : t('analytics:exec.base', { defaultValue: 'Base Case' });
                const color = isBull ? 'text-success' : isBear ? 'text-destructive' : 'text-primary';
                const borderColor = isBull ? 'border-success/30' : isBear ? 'border-destructive/30' : 'border-primary/30';
                const bgColor = isBull ? 'bg-success/5' : isBear ? 'bg-destructive/5' : 'bg-primary/5';

                return (
                  <div key={s.scenario} className={cn('rounded-lg border p-4 space-y-3', borderColor, bgColor)}>
                    <div className="flex items-center justify-between">
                      <span className={cn('text-xs font-semibold uppercase tracking-wider', color)}>{label}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {s.growthRate > 0 ? '+' : ''}{s.growthRate.toFixed(1)}% {t('analytics:exec.momGrowth', { defaultValue: 'MoM' })}
                      </span>
                    </div>
                    <div>
                      <div className={cn('text-lg font-bold tabular-nums', color)}>
                        {formatCurrency(s.year1Revenue)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {t('analytics:exec.year1Revenue', { defaultValue: 'Year 1 referral revenue' })}
                      </div>
                    </div>
                    <div>
                      <div className={cn('text-sm font-semibold tabular-nums', s.year1Net > 0 ? 'text-success' : 'text-destructive')}>
                        {formatCurrency(s.year1Net)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {t('analytics:exec.cumulativeNetProfit', { defaultValue: 'Cumulative net profit' })}
                      </div>
                    </div>
                    {/* Mini sparkline of cumulative */}
                    <div className="flex items-end gap-px h-8">
                      {s.months.map((m, i) => (
                        <div
                          key={i}
                          className={cn('flex-1 rounded-t-sm', m.cumulative >= 0 ? (isBull ? 'bg-success/60' : isBear ? 'bg-destructive/40' : 'bg-primary/50') : 'bg-destructive/30')}
                          style={{
                            height: `${Math.max(Math.abs(m.cumulative) / Math.max(...s.months.map(x => Math.abs(x.cumulative)), 1) * 100, 4)}%`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </MotionItem>
      </MotionList>

      {/* Section 10: Industry Benchmarking */}
      <MotionList className="grid grid-cols-1 gap-6">
        <MotionItem>
          <Section
            title={t('analytics:exec.benchmarkTitle', { defaultValue: 'Industry Benchmarking' })}
            subtitle={t('analytics:exec.benchmarkSubtitle', { defaultValue: 'How your clinic compares to aesthetic industry averages' })}
            icon={Target}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                {
                  label: t('analytics:exec.benchCAC', { defaultValue: 'CAC' }),
                  yours: exec.referralCAC > 0 ? formatCurrency(exec.referralCAC) : '—',
                  industry: formatCurrency(exec.benchmarks.avgClinicCAC),
                  good: exec.referralCAC > 0 && exec.referralCAC < exec.benchmarks.avgClinicCAC,
                },
                {
                  label: t('analytics:exec.benchLTV', { defaultValue: 'Patient LTV' }),
                  yours: formatCurrency(exec.referredLTV),
                  industry: formatCurrency(exec.benchmarks.avgClinicLTV),
                  good: exec.referredLTV >= exec.benchmarks.avgClinicLTV,
                },
                {
                  label: t('analytics:exec.benchRetention', { defaultValue: 'Retention' }),
                  yours: `${metrics.referral.referredRetentionRate.toFixed(0)}%`,
                  industry: `${exec.benchmarks.avgRetentionRate}%`,
                  good: metrics.referral.referredRetentionRate >= exec.benchmarks.avgRetentionRate,
                },
                {
                  label: t('analytics:exec.benchRefShare', { defaultValue: 'Referral Share' }),
                  yours: `${metrics.referral.revenueShare.toFixed(0)}%`,
                  industry: `${exec.benchmarks.avgReferralShare}%`,
                  good: metrics.referral.revenueShare >= exec.benchmarks.avgReferralShare,
                },
                {
                  label: t('analytics:exec.benchCommRate', { defaultValue: 'Commission Rate' }),
                  yours: `${exec.effectiveCommissionRate.toFixed(1)}%`,
                  industry: `${exec.benchmarks.avgCommissionRate}%`,
                  good: exec.effectiveCommissionRate <= exec.benchmarks.avgCommissionRate,
                },
              ].map((b) => (
                <div key={b.label} className="rounded-lg border border-border bg-card p-3 space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{b.label}</div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-muted-foreground">{t('analytics:exec.yours', { defaultValue: 'Yours' })}</div>
                      <div className={cn('text-sm font-bold tabular-nums', b.good ? 'text-success' : 'text-foreground')}>
                        {b.yours}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">{t('analytics:exec.industry', { defaultValue: 'Industry' })}</div>
                      <div className="text-sm font-medium text-muted-foreground tabular-nums">{b.industry}</div>
                    </div>
                  </div>
                  <div className={cn(
                    'text-[10px] font-medium',
                    b.good ? 'text-success' : 'text-muted-foreground'
                  )}>
                    {b.good
                      ? t('analytics:exec.aboveBench', { defaultValue: 'Above benchmark' })
                      : t('analytics:exec.belowBench', { defaultValue: 'Below benchmark' })}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </MotionItem>
      </MotionList>
    </div>
  );
}
