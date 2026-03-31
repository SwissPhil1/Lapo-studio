import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { format, differenceInMonths, startOfMonth } from 'date-fns';
import { Loader2, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface CohortRow {
  label: string;
  cohortDate: Date;
  size: number;
  retention: (number | null)[];
}

interface ReferrerRecord {
  id: string;
  created_at: string;
}

interface ReferralRecord {
  referrer_id: string;
  created_at: string;
}

const MAX_MONTHS = 12;

function getCellColor(value: number): string {
  if (value >= 80) return 'bg-green-600 text-white';
  if (value >= 60) return 'bg-green-500 text-white';
  if (value >= 40) return 'bg-green-400 text-white';
  if (value >= 20) return 'bg-green-300 text-green-900';
  if (value > 0) return 'bg-green-200 text-green-900';
  return 'bg-red-100 text-red-700';
}

function buildCohortRetention(
  referrers: ReferrerRecord[],
  referrals: ReferralRecord[],
): CohortRow[] {
  // Group referrers by cohort month
  const cohortMap = new Map<string, Set<string>>();
  const referrerCohortMonth = new Map<string, Date>();

  for (const r of referrers) {
    const cohortDate = startOfMonth(new Date(r.created_at));
    const key = format(cohortDate, 'yyyy-MM');
    if (!cohortMap.has(key)) cohortMap.set(key, new Set());
    cohortMap.get(key)!.add(r.id);
    referrerCohortMonth.set(r.id, cohortDate);
  }

  // Group referrals by referrer_id and month offset
  const referrerActivityMonths = new Map<string, Set<number>>();
  for (const ref of referrals) {
    const cohortDate = referrerCohortMonth.get(ref.referrer_id);
    if (!cohortDate) continue;
    const activityDate = startOfMonth(new Date(ref.created_at));
    const monthOffset = differenceInMonths(activityDate, cohortDate);
    if (monthOffset < 0 || monthOffset >= MAX_MONTHS) continue;
    if (!referrerActivityMonths.has(ref.referrer_id)) {
      referrerActivityMonths.set(ref.referrer_id, new Set());
    }
    referrerActivityMonths.get(ref.referrer_id)!.add(monthOffset);
  }

  // Build retention matrix
  const sortedKeys = Array.from(cohortMap.keys()).sort();
  const now = startOfMonth(new Date());

  return sortedKeys.map((key) => {
    const members = cohortMap.get(key)!;
    const cohortDate = new Date(key + '-01');
    const maxPossibleMonths = Math.min(
      MAX_MONTHS,
      differenceInMonths(now, cohortDate) + 1,
    );

    const retention: (number | null)[] = [];
    for (let m = 0; m < MAX_MONTHS; m++) {
      if (m >= maxPossibleMonths) {
        retention.push(null);
      } else {
        let active = 0;
        for (const memberId of members) {
          const months = referrerActivityMonths.get(memberId);
          if (months?.has(m)) active++;
        }
        retention.push(
          members.size > 0 ? Math.round((active / members.size) * 100) : 0,
        );
      }
    }

    return {
      label: format(cohortDate, 'MMM yyyy'),
      cohortDate,
      size: members.size,
      retention,
    };
  });
}

export function ReferrerCohortRetention() {
  const { t } = useTranslation(['analytics', 'common']);

  const { data: referrersData, isLoading: loadingReferrers } = useQuery({
    queryKey: ['cohort-retention-referrers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrers')
        .select('id, created_at')
        .eq('is_test', false);
      if (error) throw error;
      return (data ?? []) as ReferrerRecord[];
    },
  });

  const { data: referralsData, isLoading: loadingReferrals } = useQuery({
    queryKey: ['cohort-retention-referrals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('referrer_id, created_at')
        .eq('is_test', false);
      if (error) throw error;
      return (data ?? []) as ReferralRecord[];
    },
  });

  const isLoading = loadingReferrers || loadingReferrals;

  const cohorts = useMemo(() => {
    if (!referrersData || !referralsData) return [];
    return buildCohortRetention(referrersData, referralsData);
  }, [referrersData, referralsData]);

  const summaryMetrics = useMemo(() => {
    if (cohorts.length === 0) return null;

    const threeMonthValues: number[] = [];
    const sixMonthValues: number[] = [];
    let bestCohort = { label: '', retention: 0 };

    for (const cohort of cohorts) {
      // 3-month retention = M2 (third month)
      const m2 = cohort.retention[2];
      if (m2 !== null) threeMonthValues.push(m2);

      // 6-month retention = M5 (sixth month)
      const m5 = cohort.retention[5];
      if (m5 !== null) sixMonthValues.push(m5);

      // Best cohort by M2 retention (or M1 if M2 not available)
      const retentionScore = m2 ?? cohort.retention[1] ?? 0;
      if (retentionScore > bestCohort.retention) {
        bestCohort = { label: cohort.label, retention: retentionScore };
      }
    }

    const avg3 =
      threeMonthValues.length > 0
        ? Math.round(
            threeMonthValues.reduce((a, b) => a + b, 0) /
              threeMonthValues.length,
          )
        : null;
    const avg6 =
      sixMonthValues.length > 0
        ? Math.round(
            sixMonthValues.reduce((a, b) => a + b, 0) /
              sixMonthValues.length,
          )
        : null;

    return { avg3, avg6, bestCohort };
  }, [cohorts]);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cohorts.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        {t('analytics:noData', { defaultValue: 'No data available' })}
      </div>
    );
  }

  const monthHeaders = Array.from({ length: MAX_MONTHS }, (_, i) => `M${i}`);

  return (
    <div className="space-y-6">
      {/* Heatmap Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                {t('analytics:cohort', { defaultValue: 'Cohort' })}
              </th>
              <th className="px-2 py-2 text-center font-medium text-muted-foreground">
                {t('analytics:size', { defaultValue: 'Size' })}
              </th>
              {monthHeaders.map((h) => (
                <th
                  key={h}
                  className="px-1 py-2 text-center font-medium text-muted-foreground text-xs"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((cohort, rowIdx) => (
              <tr
                key={cohort.label}
                className="border-b border-border/50 animate-fade-in"
                style={{ animationDelay: `${rowIdx * 50}ms` }}
              >
                <td className="px-3 py-1.5 font-medium text-foreground whitespace-nowrap">
                  {cohort.label}
                </td>
                <td className="px-2 py-1.5 text-center text-muted-foreground">
                  {cohort.size}
                </td>
                {cohort.retention.map((val, colIdx) => (
                  <td key={colIdx} className="px-0.5 py-1">
                    {val !== null ? (
                      <div
                        className={cn(
                          'mx-auto rounded px-1 py-0.5 text-center text-xs font-medium min-w-[40px]',
                          getCellColor(val),
                        )}
                      >
                        {val}%
                      </div>
                    ) : (
                      <div className="mx-auto min-w-[40px] text-center text-xs text-muted-foreground/30">
                        -
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Metrics */}
      {summaryMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {summaryMetrics.avg3 !== null ? `${summaryMetrics.avg3}%` : 'N/A'}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('analytics:avg3MonthRetention', {
                defaultValue: 'Avg 3-month retention',
              })}
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-success mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {summaryMetrics.avg6 !== null ? `${summaryMetrics.avg6}%` : 'N/A'}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('analytics:avg6MonthRetention', {
                defaultValue: 'Avg 6-month retention',
              })}
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <Award className="h-5 w-5 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {summaryMetrics.bestCohort.label || 'N/A'}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('analytics:bestCohort', {
                defaultValue: 'Best cohort at {{pct}}% retention',
                pct: summaryMetrics.bestCohort.retention,
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
