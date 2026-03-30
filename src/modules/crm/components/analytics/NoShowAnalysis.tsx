import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Loader2, AlertTriangle, XCircle, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/shared/lib/constants';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import i18n from '@/i18n';
import { useTranslation } from 'react-i18next';

interface NoShowAnalysisProps {
  dateRange: string;
}

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export function NoShowAnalysis({ dateRange }: NoShowAnalysisProps) {
  const { t } = useTranslation(['analytics']);
  const { data, isLoading } = useQuery({
    queryKey: ['noshow-analysis', dateRange],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('id, status, booking_date, booking_value')
        .eq('is_test', false);

      if (error) throw error;

      const total = bookings?.length || 0;
      const noShows = bookings?.filter(b => b.status === 'no_show') || [];
      const cancelled = bookings?.filter(b => b.status === 'cancelled') || [];

      // No-show rate by day of week
      const dayStats = new Array(7).fill(null).map(() => ({ total: 0, noShow: 0 }));
      bookings?.forEach(b => {
        const day = new Date(b.booking_date).getDay();
        dayStats[day].total++;
        if (b.status === 'no_show') {
          dayStats[day].noShow++;
        }
      });

      const byDayData = dayStats.map((stat, i) => ({
        day: DAYS_FR[i],
        rate: stat.total > 0 ? Math.round((stat.noShow / stat.total) * 100) : 0,
        count: stat.noShow,
      }));

      // Monthly trend (last 6 months)
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(new Date(), i);
        const start = startOfMonth(month);
        const end = endOfMonth(month);
        
        const monthBookings = bookings?.filter(b => {
          const date = new Date(b.booking_date);
          return date >= start && date <= end;
        }) || [];
        
        const monthNoShows = monthBookings.filter(b => b.status === 'no_show').length;
        
        monthlyData.push({
          month: format(month, 'MMM', { locale: i18n.language === 'fr' ? frLocale : enUS }),
          rate: monthBookings.length > 0 ? Math.round((monthNoShows / monthBookings.length) * 100) : 0,
        });
      }

      // Lost revenue
      const lostRevenue = noShows.reduce((sum, b) => sum + (b.booking_value || 0), 0);

      return {
        noShowRate: total > 0 ? Math.round((noShows.length / total) * 100) : 0,
        cancelRate: total > 0 ? Math.round((cancelled.length / total) * 100) : 0,
        noShowCount: noShows.length,
        cancelCount: cancelled.length,
        lostRevenue,
        byDayData,
        monthlyData,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        {t('analytics:noDataAvailable')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-destructive/10 rounded-lg p-4 text-center">
          <AlertTriangle className="h-5 w-5 mx-auto text-destructive mb-2" />
          <p className="text-2xl font-bold text-foreground">{data.noShowRate}%</p>
          <p className="text-sm text-muted-foreground">Taux no-show</p>
          <p className="text-xs text-muted-foreground">{data.noShowCount} absences</p>
        </div>
        <div className="bg-warning/10 rounded-lg p-4 text-center">
          <XCircle className="h-5 w-5 mx-auto text-warning mb-2" />
          <p className="text-2xl font-bold text-foreground">{data.cancelRate}%</p>
          <p className="text-sm text-muted-foreground">Taux annulation</p>
          <p className="text-xs text-muted-foreground">{data.cancelCount} annulées</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <TrendingDown className="h-5 w-5 mx-auto text-destructive mb-2" />
          <p className="text-2xl font-bold text-foreground">{formatCurrency(data.lostRevenue)}</p>
          <p className="text-sm text-muted-foreground">Revenus perdus</p>
        </div>
      </div>

      {/* By Day Chart */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">No-shows par jour de semaine</h4>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={data.byDayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="day" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              width={30}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: any) => [`${value}%`, 'Taux']}
            />
            <Bar dataKey="rate" fill="#FF6B6B" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Trend */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Tendance mensuelle</h4>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={data.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              width={30}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: any) => [`${value}%`, 'Taux no-show']}
            />
            <Line 
              type="monotone" 
              dataKey="rate" 
              stroke="#FF6B6B" 
              strokeWidth={2}
              dot={{ fill: '#FF6B6B', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
