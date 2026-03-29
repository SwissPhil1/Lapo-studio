import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, MapPin } from 'lucide-react';

export function GeographicDistribution() {
  const { data, isLoading } = useQuery({
    queryKey: ['geographic-distribution'],
    queryFn: async () => {
      const { data: patients, error } = await supabase
        .from('patients')
        .select('city, country')
        .eq('is_test', false)
        .eq('is_business_contact', false);

      if (error) throw error;

      // Count by city
      const cityMap = new Map<string, number>();
      let filledCount = 0;

      patients?.forEach(p => {
        const city = p.city?.trim();
        if (city) {
          filledCount++;
          cityMap.set(city, (cityMap.get(city) || 0) + 1);
        }
      });

      const topCities = Array.from(cityMap.entries())
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      const total = patients?.length || 0;
      const fillRate = total > 0 ? Math.round((filledCount / total) * 100) : 0;

      return { topCities, fillRate, total, filledCount };
    },
  });

  if (isLoading) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.topCities.length === 0) {
    return (
      <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground">
        <MapPin className="h-8 w-8 mb-2" />
        <p>Aucune ville renseignée</p>
        <p className="text-sm">Complétez les profils patients</p>
      </div>
    );
  }

  const colors = [
    '#7C3AED', // violet
    '#FF2E93', // pink
    '#06B6D4', // cyan
    '#FF6B6B', // coral
    '#BFFF00', // lime
    '#9F5AFF', // violet-light
    '#FF5CAD', // pink-light
    '#22D3EE', // cyan-light
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {data.filledCount} / {data.total} patients avec ville ({data.fillRate}%)
        </span>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart 
          data={data.topCities} 
          layout="vertical"
          margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis 
            type="number"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
          />
          <YAxis 
            type="category"
            dataKey="city"
            width={100}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickFormatter={(v) => v.length > 15 ? v.slice(0, 15) + '...' : v}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: any) => [`${value} patients`, 'Patients']}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.topCities.map((_, index) => (
              <Cell key={index} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
