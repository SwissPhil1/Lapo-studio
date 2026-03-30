import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import i18n from '@/i18n';
import { useTranslation } from 'react-i18next';

interface PatientGrowthTrendProps {
  months?: number;
}

export function PatientGrowthTrend({ months = 12 }: PatientGrowthTrendProps) {
  const { t } = useTranslation(['analytics']);
  const { data, isLoading } = useQuery({
    queryKey: ['patient-growth-trend', months],
    queryFn: async () => {
      const { data: patients, error } = await supabase
        .from('patients')
        .select('created_at')
        .eq('is_test', false)
        .eq('is_business_contact', false);

      if (error) throw error;

      // Group by month
      const monthlyData = [];
      let cumulative = 0;

      for (let i = months - 1; i >= 0; i--) {
        const month = subMonths(new Date(), i);
        const start = startOfMonth(month);
        const end = endOfMonth(month);

        const monthPatients = patients?.filter(p => {
          const created = new Date(p.created_at);
          return created >= start && created <= end;
        }) || [];

        cumulative += monthPatients.length;

        monthlyData.push({
          month: format(month, 'MMM yy', { locale: i18n.language === 'fr' ? frLocale : enUS }),
          nouveaux: monthPatients.length,
          cumul: cumulative,
        });
      }

      return monthlyData;
    },
  });

  if (isLoading) {
    return (
      <div className="h-[250px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
        {t('analytics:noDataAvailable')}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorNouveaux" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis 
          dataKey="month" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          width={40}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: any, name: any) => [
            value,
            name === 'nouveaux' ? 'Nouveaux patients' : 'Total cumulé'
          ]}
        />
        <Area
          type="monotone"
          dataKey="nouveaux"
          stroke="#7C3AED"
          strokeWidth={2}
          fill="url(#colorNouveaux)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
