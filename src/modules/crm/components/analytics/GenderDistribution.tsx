import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2 } from 'lucide-react';

const GENDER_LABELS: Record<string, string> = {
  female: 'Femmes',
  male: 'Hommes',
  other: 'Autre',
  unknown: 'Non renseigné',
};

const COLORS = {
  female: 'hsl(330, 65%, 55%)',
  male: 'hsl(210, 65%, 55%)',
  other: 'hsl(173, 58%, 45%)',
  unknown: 'hsl(215, 15%, 65%)',
};

export function GenderDistribution() {
  const { data, isLoading } = useQuery({
    queryKey: ['gender-distribution'],
    queryFn: async () => {
      const { data: patients, error } = await supabase
        .from('patients')
        .select('gender')
        .eq('is_test', false)
        .eq('is_business_contact', false);

      if (error) throw error;

      const genderCounts: Record<string, number> = {
        female: 0,
        male: 0,
        other: 0,
        unknown: 0,
      };

      patients?.forEach(p => {
        const gender = p.gender?.toLowerCase() || 'unknown';
        if (gender in genderCounts) {
          genderCounts[gender]++;
        } else {
          genderCounts.unknown++;
        }
      });

      const total = patients?.length || 0;
      
      return Object.entries(genderCounts)
        .filter(([_, count]) => count > 0)
        .map(([gender, count]) => ({
          name: GENDER_LABELS[gender] || gender,
          value: count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          color: COLORS[gender as keyof typeof COLORS] || COLORS.unknown,
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
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: any, name: any) => [value, name]}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap justify-center gap-4">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-foreground">{entry.name}</span>
            <span className="text-sm font-medium text-muted-foreground">
              {entry.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
