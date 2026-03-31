import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';


export function TreatmentsByGender() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['treatments-by-gender'],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          service,
          patient:patient_id (
            gender
          )
        `)
        .eq('is_test', false);

      if (error) throw error;

      // Track treatments by gender
      const treatmentByGender: Record<string, { female: number; male: number }> = {};

      bookings?.forEach((b: any) => {
        const gender = b.patient?.gender?.toLowerCase();
        if (gender !== 'female' && gender !== 'male') return;
        
        const treatment = b.service || 'Autre';
        if (!treatmentByGender[treatment]) {
          treatmentByGender[treatment] = { female: 0, male: 0 };
        }
        treatmentByGender[treatment][gender as 'female' | 'male']++;
      });

      // Get top 6 treatments by total count
      const chartData = Object.entries(treatmentByGender)
        .map(([name, counts]) => ({
          name: name.length > 15 ? name.slice(0, 15) + '...' : name,
          fullName: name,
          Femmes: counts.female,
          Hommes: counts.male,
          total: counts.female + counts.male,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);

      return chartData;
    },
  });

  if (isLoading) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-muted-foreground">
        {t('analytics.noDataAvailable', { defaultValue: 'No data available' })}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis 
          dataKey="name" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          angle={-15}
          textAnchor="end"
          height={50}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          width={40}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
          iconSize={10}
        />
        <Bar 
          dataKey="Femmes" 
          fill="#FF2E93"
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="Hommes" 
          fill="#06B6D4"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
