import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2 } from 'lucide-react';
import { differenceInYears } from 'date-fns';

const AGE_GROUPS = [
  { label: '18-24', min: 18, max: 24 },
  { label: '25-34', min: 25, max: 34 },
  { label: '35-44', min: 35, max: 44 },
  { label: '45-54', min: 45, max: 54 },
  { label: '55-64', min: 55, max: 64 },
  { label: '65+', min: 65, max: 150 },
];

const COLORS = [
  'hsl(173, 58%, 35%)',
  'hsl(173, 58%, 42%)',
  'hsl(173, 58%, 49%)',
  'hsl(173, 58%, 56%)',
  'hsl(173, 58%, 63%)',
  'hsl(173, 58%, 70%)',
];

export function AgeGroupDistribution() {
  const { data, isLoading } = useQuery({
    queryKey: ['age-group-distribution'],
    queryFn: async () => {
      const { data: patients, error } = await supabase
        .from('patients')
        .select('date_of_birth')
        .eq('is_test', false)
        .eq('is_business_contact', false)
        .not('date_of_birth', 'is', null);

      if (error) throw error;

      const today = new Date();
      const groupCounts = AGE_GROUPS.map(g => ({ ...g, count: 0 }));
      let unknownCount = 0;

      patients?.forEach(p => {
        if (!p.date_of_birth) {
          unknownCount++;
          return;
        }
        
        const age = differenceInYears(today, new Date(p.date_of_birth));
        const group = groupCounts.find(g => age >= g.min && age <= g.max);
        if (group) {
          group.count++;
        }
      });

      const total = patients?.length || 0;

      return groupCounts.map((g, i) => ({
        name: g.label,
        count: g.count,
        percentage: total > 0 ? Math.round((g.count / total) * 100) : 0,
        color: COLORS[i],
      }));
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
        Aucune donnée d'âge disponible
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis 
            dataKey="name" 
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
            formatter={(value: any, _name: any, props: any) => [
              `${value} patients (${props.payload.percentage}%)`,
              'Patients'
            ]}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
