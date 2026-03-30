import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared/lib/supabase';
import { format, subDays, subMonths, eachDayOfInterval, eachMonthOfInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { BOOKING_STATUS } from '@/shared/lib/bookingStatus';
import { formatCurrency } from '@/shared/lib/format';
import { DrillDownPanel, type DrillDownData } from './DrillDownPanel';

interface RevenueChartProps {
  dateRange: string;
}

function getDateRange(range: string): { start: Date; end: Date; granularity: 'day' | 'month' } {
  const end = new Date();
  let start: Date;
  let granularity: 'day' | 'month' = 'day';
  
  switch (range) {
    case '7d':
      start = subDays(end, 7);
      break;
    case '30d':
      start = subDays(end, 30);
      break;
    case '90d':
      start = subDays(end, 90);
      granularity = 'month';
      break;
    case '12m':
      start = subMonths(end, 12);
      granularity = 'month';
      break;
    case 'ytd':
      start = new Date(end.getFullYear(), 0, 1);
      granularity = 'month';
      break;
    default:
      start = subMonths(end, 12);
      granularity = 'month';
  }
  
  return { start, end, granularity };
}

export function RevenueChart({ dateRange }: RevenueChartProps) {
  const { t } = useTranslation(['analytics']);
  const { start, end, granularity } = getDateRange(dateRange);
  const [drillDown, setDrillDown] = useState<DrillDownData | null>(null);

  // Store raw bookings for drill-down
  const { data: queryResult, isLoading } = useQuery({
    queryKey: ['revenue-chart', dateRange],
    queryFn: async () => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          booking_date, booking_value, treatment_name,
          patient:patient_id (first_name, last_name)
        `)
        .eq('status', BOOKING_STATUS.COMPLETED)
        .gte('booking_date', start.toISOString())
        .lte('booking_date', end.toISOString());

      // Group by date
      const revenueByDate: Record<string, number> = {};
      const bookingsByDate: Record<string, any[]> = {};

      (bookings || []).forEach((booking: any) => {
        const date = granularity === 'day'
          ? format(parseISO(booking.booking_date), 'yyyy-MM-dd')
          : format(parseISO(booking.booking_date), 'yyyy-MM');
        revenueByDate[date] = (revenueByDate[date] || 0) + (booking.booking_value || 0);
        if (!bookingsByDate[date]) bookingsByDate[date] = [];
        bookingsByDate[date].push(booking);
      });

      // Generate all dates in range
      const intervals = granularity === 'day'
        ? eachDayOfInterval({ start, end })
        : eachMonthOfInterval({ start, end });

      const chartData = intervals.map(date => {
        const key = granularity === 'day'
          ? format(date, 'yyyy-MM-dd')
          : format(date, 'yyyy-MM');
        const label = granularity === 'day'
          ? format(date, 'd MMM', { locale: fr })
          : format(date, 'MMM yy', { locale: fr });

        return {
          date: key,
          label,
          revenue: revenueByDate[key] || 0,
        };
      });

      return { chartData, bookingsByDate };
    },
  });

  const chartData = queryResult?.chartData;

  const handleChartClick = useCallback((payload: any) => {
    if (!payload?.activePayload?.[0]?.payload || !queryResult) return;
    const point = payload.activePayload[0].payload;
    const dateKey = point.date;
    const rawBookings = queryResult.bookingsByDate[dateKey] || [];

    setDrillDown({
      title: t('analytics:drillDown.revenueTitle'),
      subtitle: point.label,
      columns: [
        { key: 'patient', label: t('analytics:drillDown.colPatient') },
        { key: 'treatment', label: t('analytics:drillDown.colTreatment') },
        { key: 'value', label: t('analytics:drillDown.colValue'), format: (v: number) => formatCurrency(v) },
        { key: 'date', label: t('analytics:drillDown.colDate') },
      ],
      rows: rawBookings.map((b: any) => ({
        patient: `${b.patient?.first_name || ''} ${b.patient?.last_name || ''}`.trim() || '-',
        treatment: b.treatment_name || '-',
        value: b.booking_value || 0,
        date: b.booking_date ? format(parseISO(b.booking_date), 'dd/MM/yyyy') : '-',
      })),
    });
  }, [queryResult, t]);
  
  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }
  
  return (
    <>
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="label"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}€`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            formatter={(value: any) => [`${value.toLocaleString()}€`, 'Revenus']}
            labelFormatter={(label) => label}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground mt-1 text-center">
        {t('analytics:ltv.clickToExplore')}
      </p>
    </div>
    <DrillDownPanel data={drillDown} onClose={() => setDrillDown(null)} />
    </>
  );
}
