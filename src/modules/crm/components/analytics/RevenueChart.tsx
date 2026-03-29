import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { format, subDays, subMonths, eachDayOfInterval, eachMonthOfInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { BOOKING_STATUS } from '@/shared/lib/bookingStatus';

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
  const { start, end, granularity } = getDateRange(dateRange);
  
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['revenue-chart', dateRange],
    queryFn: async () => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_date, booking_value')
        .eq('status', BOOKING_STATUS.COMPLETED)
        .gte('booking_date', start.toISOString())
        .lte('booking_date', end.toISOString());
      
      // Group by date
      const revenueByDate: Record<string, number> = {};
      
      bookings?.forEach(booking => {
        const date = granularity === 'day' 
          ? format(parseISO(booking.booking_date), 'yyyy-MM-dd')
          : format(parseISO(booking.booking_date), 'yyyy-MM');
        revenueByDate[date] = (revenueByDate[date] || 0) + (booking.booking_value || 0);
      });
      
      // Generate all dates in range
      const intervals = granularity === 'day'
        ? eachDayOfInterval({ start, end })
        : eachMonthOfInterval({ start, end });
      
      return intervals.map(date => {
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
    },
  });
  
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
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
    </div>
  );
}
