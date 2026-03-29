import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";

import { KPICard } from "@/modules/admin/components/KPICard";
import { DataTable, type Column } from "@/modules/admin/components/DataTable";
import { EmptyState } from "@/modules/admin/components/EmptyState";
import { Users, DollarSign, RefreshCw, Gift, UserPlus, ArrowRightLeft, ShoppingBag } from "lucide-react";
import { formatCurrency, formatDate, formatLapoCash } from "@/shared/lib/format";

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLatestActivities, filterActivities } from "@/shared/hooks/useLatestActivities";
import type { ActivityCategory, ActivityItem } from "@/shared/types/activity";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TimeRange = 'this_month' | 'last_month' | 'ytd' | 'all';

interface NetRevenueKPI {
  gross_revenue: number;
  total_commissions: number;
  net_revenue: number;
}

interface ConversionRateKPI {
  total_referrals: number;
  booked_count: number;
  confirmed_count: number;
  converted_count: number;
  conversion_rate: number;
}

interface NewReferralsKPI {
  new_referrals: number;
}

interface PendingCommissionsKPI {
  pending_amount: number;
}

function getDateRange(range: TimeRange) {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  if (range === 'this_month') {
    return {
      start: startOfThisMonth.toISOString(),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString(),
    };
  }

  if (range === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  if (range === 'ytd') {
    return {
      start: startOfYear.toISOString(),
      end: now.toISOString(),
    };
  }

  // 'all' => no limit
  return { start: null, end: null };
}

interface ReferrerPerformance {
  referrer_id: string;
  referrer_email: string;
  referrer_code: string;
  company_name: string | null;
  total_referrals: number;
  confirmed_referrals: number;
  total_commissions: number;
  last_referral_at: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('this_month');
  
  const [sortBy, setSortBy] = useState<'commissions' | 'referrals'>('commissions');
  const [activityFilter, setActivityFilter] = useState<ActivityCategory | "all">("all");
  const [activityLimit, setActivityLimit] = useState<5 | 10>(5);
  const { t } = useTranslation(['dashboard', 'common']);

  // Latest activities
  const { data: allActivities, isLoading: loadingActivities } = useLatestActivities(10);
  const filteredActivities = useMemo(
    () => filterActivities(allActivities, activityFilter),
    [allActivities, activityFilter]
  );

  // KPI 1: Net Revenue
  const { data: netRevenueData, isLoading: loadingNetRevenue } = useQuery({
    queryKey: ["net-revenue-kpi", timeRange],
    queryFn: async () => {
      const { start, end } = getDateRange(timeRange);
      const { data, error } = await supabase.rpc('get_net_revenue_kpi', {
        p_start_date: start,
        p_end_date: end
      });
      if (error) throw error;
      return data as unknown as NetRevenueKPI;
    },
  });

  // KPI 2: Conversion Rate
  const { data: conversionData, isLoading: loadingConversion } = useQuery({
    queryKey: ["conversion-rate-kpi", timeRange],
    queryFn: async () => {
      const { start, end } = getDateRange(timeRange);
      const { data, error } = await supabase.rpc('get_conversion_rate_kpi', {
        p_start_date: start,
        p_end_date: end
      });
      if (error) throw error;
      return data as unknown as ConversionRateKPI;
    },
  });

  // KPI 3: New Referrals
  const { data: newReferralsData, isLoading: loadingNewReferrals } = useQuery({
    queryKey: ["new-referrals-kpi", timeRange],
    queryFn: async () => {
      const { start, end } = getDateRange(timeRange);
      const { data, error } = await supabase.rpc('get_new_referrals_kpi', {
        p_start_date: start,
        p_end_date: end
      });
      if (error) throw error;
      return data as unknown as NewReferralsKPI;
    },
  });

  // KPI 4: Pending Commissions (not time-filtered)
  const { data: pendingData, isLoading: loadingPending } = useQuery({
    queryKey: ["pending-commissions-kpi"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pending_commissions_kpi');
      if (error) throw error;
      return data as unknown as PendingCommissionsKPI;
    },
  });

  // KPI 5: Converted Commissions (LAPO Cash)
  const { data: convertedStats, isLoading: loadingConverted } = useQuery({
    queryKey: ["converted-commissions-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lapo_cash_transactions")
        .select("amount, description")
        .eq("type", "commission_conversion");
      
      if (error) throw error;
      
      let totalChf = 0;
      let totalLc = 0;
      
      (data || []).forEach(tx => {
        totalLc += tx.amount || 0;
        // Parse CHF amount from description: "Conversion de 10.00 CHF (taux: 1.10)"
        const match = tx.description?.match(/Conversion de ([\d.]+) CHF/);
        if (match) {
          totalChf += parseFloat(match[1]);
        }
      });
      
      return { count: data?.length || 0, totalChf, totalLc };
    },
  });

  // Helper to get activity icon and color
  const getActivityIcon = (activity: ActivityItem) => {
    // For LAPO Cash category, differentiate by type
    if (activity.category === "lapo_cash") {
      if (activity.type === "commission_converted") {
        return <ArrowRightLeft className="h-4 w-4 text-amber-600" />;
      }
      if (activity.type === "redemption") {
        return <ShoppingBag className="h-4 w-4 text-red-600" />;
      }
      // birthday_gift, manual_credit, workshop_reward → Gift icon
      return <Gift className="h-4 w-4 text-purple-600" />;
    }

    switch (activity.category) {
      case "commission":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case "referral":
        return <UserPlus className="h-4 w-4 text-blue-600" />;
      default:
        return <RefreshCw className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleActivityClick = (activity: ActivityItem) => {
    if (activity.category === "commission" && activity.actor_id) {
      navigate(`/admin/referrers/${activity.actor_id}`);
    } else if (activity.category === "referral") {
      navigate(`/admin/referrals/${activity.id}`);
    } else if (activity.category === "lapo_cash" && activity.actor_id) {
      navigate(`/admin/referrers/${activity.actor_id}`);
    }
  };


  // Fetch top referrers using pre-aggregated view (eliminates N+1 queries)
  const { data: topReferrers, isLoading } = useQuery({
    queryKey: ["top-referrers", sortBy],
    queryFn: async () => {
      // Single query to the pre-aggregated v_referrer_performance view
      // Note: View contains all-time stats; date filtering would require RPC function
      const { data, error } = await supabase
        .from("v_referrer_performance")
        .select("*")
        .order(sortBy === 'commissions' ? 'total_commissions' : 'confirmed_referrals', 
               { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      return (data || []).map(row => ({
        referrer_id: row.referrer_id,
        referrer_email: row.referrer_email,
        referrer_code: row.referrer_code,
        company_name: row.company_name,
        total_referrals: row.total_referrals || 0,
        confirmed_referrals: row.confirmed_referrals || 0,
        total_commissions: row.total_commissions || 0,
        last_referral_at: row.last_referral_at,
      })) as ReferrerPerformance[];
    },
  });

  const columns: Column<ReferrerPerformance>[] = [
    {
      key: "referrer",
      header: t('dashboard:referrer'),
      cell: (row) => (
        <div>
          <div className="font-medium text-foreground">{row.referrer_email}</div>
          <div className="text-sm text-muted-foreground">{row.referrer_code}</div>
        </div>
      ),
    },
    {
      key: "company",
      header: t('dashboard:company'),
      cell: (row) => (
        <span className="text-sm text-foreground">
          {row.company_name || "—"}
        </span>
      ),
    },
    {
      key: "referrals",
      header: t('dashboard:confirmedReferrals'),
      cell: (row) => (
        <span className="text-sm font-medium text-foreground">
          {row.confirmed_referrals}
        </span>
      ),
    },
    {
      key: "commissions",
      header: t('dashboard:totalCommissions'),
      cell: (row) => (
        <span className="text-sm font-semibold text-foreground">
          {formatCurrency(row.total_commissions)}
        </span>
      ),
    },
    {
      key: "last_referral",
      header: t('dashboard:lastReferral'),
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.last_referral_at ? formatDate(row.last_referral_at) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">{t('dashboard:title')}</h1>
            <p className="mt-2 text-muted-foreground">
              {t('dashboard:description')}
            </p>
          </div>
          <div className="inline-flex rounded-lg border bg-background p-0.5">
            {[
              { label: t('dashboard:thisMonth'), value: 'this_month' },
              { label: t('dashboard:lastMonth'), value: 'last_month' },
              { label: t('dashboard:ytd'), value: 'ytd' },
              { label: t('dashboard:allTime'), value: 'all' },
            ].map(option => (
              <Button
                key={option.value}
                size="sm"
                variant={timeRange === option.value ? 'default' : 'ghost'}
                className="px-3"
                onClick={() => setTimeRange(option.value as TimeRange)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* KPI 1: Net Revenue */}
          <KPICard
            title={t('dashboard:netRevenue')}
            value={formatCurrency(netRevenueData?.net_revenue || 0)}
            subtitle={`${t('dashboard:grossRevenue')} ${formatCurrency(netRevenueData?.gross_revenue || 0)} – ${t('dashboard:commissionsTotal')} ${formatCurrency(netRevenueData?.total_commissions || 0)}`}
            loading={loadingNetRevenue}
          />

          {/* KPI 2: Conversion Rate */}
          <KPICard
            title={t('dashboard:conversionRate')}
            value={`${conversionData?.conversion_rate || 0}%`}
            subtitle={`${t('dashboard:booked')} ${conversionData?.booked_count || 0} • ${t('dashboard:confirmed')} ${conversionData?.confirmed_count || 0} • ${t('dashboard:total')} ${conversionData?.total_referrals || 0}`}
            loading={loadingConversion}
          />

          {/* KPI 3: New Referrals */}
          <KPICard
            title={t('dashboard:newReferrals')}
            value={newReferralsData?.new_referrals || 0}
            subtitle={t('dashboard:allStatuses')}
            loading={loadingNewReferrals}
          />

          {/* KPI 4: Pending Commissions */}
          <KPICard
            title={t('dashboard:pendingCommissions')}
            value={formatCurrency(pendingData?.pending_amount || 0)}
            subtitle={t('dashboard:toPayReferrers')}
            loading={loadingPending}
          />

          {/* KPI 5: Converted to LAPO Cash */}
          <KPICard
            title={t('dashboard:convertedToLapoCash')}
            value={`${formatCurrency(convertedStats?.totalChf || 0)} → ${formatLapoCash(convertedStats?.totalLc || 0)}`}
            subtitle={`${convertedStats?.count || 0} ${t('dashboard:conversions')}`}
            loading={loadingConverted}
            valueClassName="text-amber-600"
          />
        </div>

        {/* Latest Activities */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {t('dashboard:latestActivity')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('dashboard:latestActivityNote')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={activityFilter} onValueChange={(v) => setActivityFilter(v as ActivityCategory | "all")}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t('dashboard:filterByCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('dashboard:allActivities')}</SelectItem>
                  <SelectItem value="commission">{t('dashboard:categoryCommission')}</SelectItem>
                  <SelectItem value="lapo_cash">{t('dashboard:categoryLapoCash')}</SelectItem>
                  <SelectItem value="referral">{t('dashboard:categoryReferral')}</SelectItem>
                </SelectContent>
              </Select>
              <div className="inline-flex rounded-md border bg-background p-0.5">
                <Button
                  size="sm"
                  variant={activityLimit === 5 ? "default" : "ghost"}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setActivityLimit(5)}
                >
                  5
                </Button>
                <Button
                  size="sm"
                  variant={activityLimit === 10 ? "default" : "ghost"}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setActivityLimit(10)}
                >
                  10
                </Button>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border bg-card">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t('dashboard:date')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t('dashboard:referrer')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t('dashboard:type')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    {t('dashboard:amountChf')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    {t('dashboard:original')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    {t('dashboard:amountLc')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingActivities ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      {t('common:loading')}
                    </td>
                  </tr>
                ) : !filteredActivities || filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      {t('common:noData')}
                    </td>
                  </tr>
                ) : (
                  filteredActivities.slice(0, activityLimit).map((activity) => (
                    <tr 
                      key={`${activity.category}-${activity.id}`} 
                      className="hover:bg-muted/30 cursor-pointer" 
                      onClick={() => handleActivityClick(activity)}
                    >
                      <td className="px-4 py-3 text-sm text-foreground">
                        {formatDate(activity.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        <div>
                          <span className="font-medium">{activity.actor_name || "—"}</span>
                          {activity.actor_code && (
                            <span className="ml-2 text-xs text-muted-foreground">{activity.actor_code}</span>
                          )}
                        </div>
                        {activity.subject_name && (
                          <div className="text-xs text-muted-foreground">→ {activity.subject_name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getActivityIcon(activity)}
                          <span className="text-sm text-foreground">
                            {t(`dashboard:activityTypes.${activity.type}`, { defaultValue: activity.type })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                        {activity.currency === "CHF" && activity.amount !== undefined
                          ? formatCurrency(activity.amount)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {activity.originalAmount && activity.originalAmount !== activity.amount
                          ? formatCurrency(activity.originalAmount)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-purple-600">
                        {activity.secondaryAmount !== undefined
                          ? formatLapoCash(activity.secondaryAmount)
                          : activity.currency === "LC" && activity.amount !== undefined
                            ? formatLapoCash(activity.amount)
                            : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Referrers */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {t('dashboard:topPerformers')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Top 5 · {t('dashboard:allTime')}
              </p>
            </div>
            <div className="flex gap-2">
              {/* Sort toggle */}
              <div className="inline-flex rounded-lg border bg-background p-0.5">
                <Button
                  size="sm"
                  variant={sortBy === 'commissions' ? 'default' : 'ghost'}
                  className="px-3"
                  onClick={() => setSortBy('commissions')}
                >
                  CHF
                </Button>
                <Button
                  size="sm"
                  variant={sortBy === 'referrals' ? 'default' : 'ghost'}
                  className="px-3"
                  onClick={() => setSortBy('referrals')}
                >
                  #
                </Button>
              </div>
            </div>
          </div>
          {!isLoading && (!topReferrers || topReferrers.length === 0) ? (
            <EmptyState
              title={t("common:emptyState.noReferrers")}
              description={t("common:emptyState.noReferrersDesc")}
              icon={Users}
            />
          ) : (
            <DataTable
              data={topReferrers || []}
              columns={columns}
              loading={isLoading}
              onRowClick={(row) => navigate(`/admin/referrers/${row.referrer_id}`)}
            />
          )}
        </div>
      </div>
  );
}
