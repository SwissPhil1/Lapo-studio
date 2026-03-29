import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';
import { differenceInYears } from 'date-fns';

const AGE_GROUPS = [
  { label: '18-34', min: 18, max: 34 },
  { label: '35-49', min: 35, max: 49 },
  { label: '50+', min: 50, max: 150 },
];



export function TreatmentsByAgeGroup() {
  const { data, isLoading } = useQuery({
    queryKey: ['treatments-by-age'],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          service,
          patient:patient_id (
            date_of_birth
          )
        `)
        .eq('is_test', false);

      if (error) throw error;

      const today = new Date();
      
      // Initialize data structure
      const ageGroupData = AGE_GROUPS.map(g => ({
        ageGroup: g.label,
        treatments: {} as Record<string, number>,
      }));

      // Track top treatments
      const treatmentCounts: Record<string, number> = {};

      bookings?.forEach((b: any) => {
        if (!b.patient?.date_of_birth) return;
        
        const age = differenceInYears(today, new Date(b.patient.date_of_birth));
        const groupIndex = AGE_GROUPS.findIndex(g => age >= g.min && age <= g.max);
        
        if (groupIndex === -1) return;

        const treatment = b.service || 'Autre';
        treatmentCounts[treatment] = (treatmentCounts[treatment] || 0) + 1;
        ageGroupData[groupIndex].treatments[treatment] = 
          (ageGroupData[groupIndex].treatments[treatment] || 0) + 1;
      });

      // Get top 5 treatments
      const topTreatments = Object.entries(treatmentCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name);

      // Format for chart
      const chartData = ageGroupData.map(ag => {
        const row: any = { ageGroup: ag.ageGroup };
        topTreatments.forEach(t => {
          row[t] = ag.treatments[t] || 0;
        });
        return row;
      });

      return { chartData, topTreatments };
    },
  });

  if (isLoading) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.chartData.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }

  const colors = [
    'hsl(173, 58%, 39%)',
    'hsl(210, 65%, 55%)',
    'hsl(330, 65%, 55%)',
    'hsl(38, 92%, 50%)',
    'hsl(152, 69%, 40%)',
  ];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis 
          dataKey="ageGroup" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
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
        />
        <Legend 
          wrapperStyle={{ fontSize: '11px' }}
          iconSize={10}
        />
        {data.topTreatments.map((treatment, i) => (
          <Bar 
            key={treatment}
            dataKey={treatment}
            stackId="a"
            fill={colors[i % colors.length]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
