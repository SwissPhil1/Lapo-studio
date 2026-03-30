import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared/lib/supabase';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Loader2, TrendingUp, Users, Banknote, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/shared/lib/format';
import { format, parseISO } from 'date-fns';
import { BOOKING_STATUS } from '@/shared/lib/bookingStatus';
import { DrillDownPanel, type DrillDownData } from './DrillDownPanel';

export function LTVAnalysis() {
  const { t } = useTranslation(['analytics']);
  const [drillDown, setDrillDown] = useState<DrillDownData | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['ltv-analysis'],
    queryFn: async () => {
      // Get all completed bookings with patient info
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          booking_value,
          booking_date,
          patient_id,
          patient:patient_id (
            first_name,
            last_name,
            created_at,
            utm_source,
            lead_source
          )
        `)
        .eq('is_test', false)
        .eq('status', BOOKING_STATUS.COMPLETED);

      if (error) throw error;

      // Calculate LTV per patient
      const patientMap = new Map<string, {
        total: number;
        bookingCount: number;
        firstName: string;
        lastName: string;
        createdAt: string;
        source: string;
      }>();

      (bookings || []).forEach((b: any) => {
        const pid = b.patient_id;
        const existing = patientMap.get(pid) || {
          total: 0,
          bookingCount: 0,
          firstName: b.patient?.first_name || '',
          lastName: b.patient?.last_name || '',
          createdAt: b.patient?.created_at || '',
          source: b.patient?.utm_source || b.patient?.lead_source || 'direct',
        };
        existing.total += b.booking_value || 0;
        existing.bookingCount++;
        patientMap.set(pid, existing);
      });

      const allLTVs = Array.from(patientMap.values()).map(p => p.total);
      const sortedLTVs = [...allLTVs].sort((a, b) => a - b);

      // Average LTV
      const avgLTV = allLTVs.length > 0
        ? Math.round(allLTVs.reduce((a, b) => a + b, 0) / allLTVs.length)
        : 0;

      // Median LTV
      const medianLTV = sortedLTVs.length > 0
        ? sortedLTVs.length % 2 === 0
          ? Math.round((sortedLTVs[sortedLTVs.length / 2 - 1] + sortedLTVs[sortedLTVs.length / 2]) / 2)
          : Math.round(sortedLTVs[Math.floor(sortedLTVs.length / 2)])
        : 0;

      // LTV distribution histogram
      const maxLTV = sortedLTVs.length > 0 ? sortedLTVs[sortedLTVs.length - 1] : 0;
      const bucketSize = maxLTV > 0 ? Math.max(Math.ceil(maxLTV / 8 / 100) * 100, 100) : 100;
      const buckets: { range: string; count: number; min: number; max: number }[] = [];
      for (let i = 0; i < 8; i++) {
        const min = i * bucketSize;
        const max = (i + 1) * bucketSize;
        buckets.push({
          range: `${Math.round(min / 1000)}k-${Math.round(max / 1000)}k`,
          count: allLTVs.filter(v => v >= min && v < max).length,
          min,
          max,
        });
      }
      // Filter out empty trailing buckets
      while (buckets.length > 1 && buckets[buckets.length - 1].count === 0) {
        buckets.pop();
      }

      // LTV by source
      const sourceMap = new Map<string, { total: number; count: number }>();
      patientMap.forEach(p => {
        const src = p.source;
        const existing = sourceMap.get(src) || { total: 0, count: 0 };
        existing.total += p.total;
        existing.count++;
        sourceMap.set(src, existing);
      });
      const bySource = Array.from(sourceMap.entries())
        .map(([source, d]) => ({
          source,
          avgLtv: d.count > 0 ? Math.round(d.total / d.count) : 0,
          count: d.count,
        }))
        .sort((a, b) => b.avgLtv - a.avgLtv)
        .slice(0, 8);

      // LTV trend by cohort month (based on patient created_at)
      const cohortMap = new Map<string, { total: number; count: number }>();
      patientMap.forEach(p => {
        if (!p.createdAt) return;
        const month = format(parseISO(p.createdAt), 'yyyy-MM');
        const existing = cohortMap.get(month) || { total: 0, count: 0 };
        existing.total += p.total;
        existing.count++;
        cohortMap.set(month, existing);
      });
      const ltvTrend = Array.from(cohortMap.entries())
        .map(([month, d]) => ({
          month,
          label: format(parseISO(month + '-01'), 'MMM yy'),
          avgLtv: d.count > 0 ? Math.round(d.total / d.count) : 0,
          patients: d.count,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12);

      // Patient details for drill-down
      const patientDetails = Array.from(patientMap.entries())
        .map(([id, p]) => ({
          id,
          name: `${p.firstName} ${p.lastName}`,
          ltv: p.total,
          bookings: p.bookingCount,
          source: p.source,
          joinedAt: p.createdAt ? format(parseISO(p.createdAt), 'dd/MM/yyyy') : '-',
        }))
        .sort((a, b) => b.ltv - a.ltv);

      return {
        avgLTV,
        medianLTV,
        totalPatients: patientMap.size,
        distribution: buckets,
        bySource,
        ltvTrend,
        patientDetails,
      };
    },
  });

  const handleDistributionClick = useCallback((bucketData: any) => {
    if (!data || !bucketData) return;
    const patients = data.patientDetails.filter(
      p => p.ltv >= bucketData.min && p.ltv < bucketData.max
    );
    setDrillDown({
      title: t('analytics:ltv.drillDownDistribution'),
      subtitle: `${bucketData.range} (${patients.length} ${t('analytics:ltv.patients')})`,
      columns: [
        { key: 'name', label: t('analytics:ltv.colName') },
        { key: 'ltv', label: t('analytics:ltv.colLtv'), format: (v: number) => formatCurrency(v) },
        { key: 'bookings', label: t('analytics:ltv.colBookings') },
        { key: 'source', label: t('analytics:ltv.colSource') },
      ],
      rows: patients,
    });
  }, [data, t]);

  const handleSourceClick = useCallback((sourceData: any) => {
    if (!data || !sourceData) return;
    const patients = data.patientDetails.filter(p => p.source === sourceData.source);
    setDrillDown({
      title: t('analytics:ltv.drillDownSource'),
      subtitle: `${sourceData.source} (${patients.length} ${t('analytics:ltv.patients')})`,
      columns: [
        { key: 'name', label: t('analytics:ltv.colName') },
        { key: 'ltv', label: t('analytics:ltv.colLtv'), format: (v: number) => formatCurrency(v) },
        { key: 'bookings', label: t('analytics:ltv.colBookings') },
        { key: 'joinedAt', label: t('analytics:ltv.colJoined') },
      ],
      rows: patients,
    });
  }, [data, t]);

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.totalPatients === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Banknote className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">{t('analytics:ltv.noData')}</p>
        <p className="text-sm mt-1">{t('analytics:ltv.noDataHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-primary/10 rounded-lg p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{formatCurrency(data.avgLTV)}</p>
          <p className="text-sm text-muted-foreground">{t('analytics:ltv.averageLtv')}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <BarChart3 className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{formatCurrency(data.medianLTV)}</p>
          <p className="text-sm text-muted-foreground">{t('analytics:ltv.medianLtv')}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <Users className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold">{data.totalPatients}</p>
          <p className="text-sm text-muted-foreground">{t('analytics:ltv.patientsAnalyzed')}</p>
        </div>
      </div>

      {/* LTV Distribution */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          {t('analytics:ltv.distributionTitle')}
        </h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.distribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: any) => [value, t('analytics:ltv.patients')]}
            />
            <Bar
              dataKey="count"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(entry: any) => handleDistributionClick(entry)}
            />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          {t('analytics:ltv.clickToExplore')}
        </p>
      </div>

      {/* LTV by Source */}
      {data.bySource.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            {t('analytics:ltv.bySourceTitle')}
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.bySource} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(v) => formatCurrency(v)}
              />
              <YAxis
                type="category"
                dataKey="source"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                width={80}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: any) => [formatCurrency(value), t('analytics:ltv.avgLtvLabel')]}
              />
              <Bar
                dataKey="avgLtv"
                fill="hsl(var(--chart-2))"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={(entry: any) => handleSourceClick(entry)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* LTV Trend by Cohort */}
      {data.ltvTrend.length > 1 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            {t('analytics:ltv.trendTitle')}
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.ltvTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(v) => formatCurrency(v)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: any, _name: any, props: any) => [
                  formatCurrency(value),
                  `${t('analytics:ltv.avgLtvLabel')} (${props.payload.patients} ${t('analytics:ltv.patients')})`,
                ]}
              />
              <Line
                type="monotone"
                dataKey="avgLtv"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <DrillDownPanel data={drillDown} onClose={() => setDrillDown(null)} />
    </div>
  );
}
