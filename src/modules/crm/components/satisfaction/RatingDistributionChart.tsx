import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { type SatisfactionRating } from './SatisfactionWidget';

interface RatingDistributionChartProps {
  ratings: SatisfactionRating[];
}

function getRatingColor(rating: number): string {
  if (rating >= 9) return '#10b981'; // emerald-500
  if (rating >= 7) return '#eab308'; // yellow-500
  return '#ef4444'; // red-500
}

export function RatingDistributionChart({ ratings }: RatingDistributionChartProps) {
  const data = useMemo(() => {
    const counts = Array.from({ length: 11 }, (_, i) => ({
      rating: i,
      count: 0,
    }));

    for (const r of ratings) {
      if (r.rating >= 0 && r.rating <= 10) {
        counts[r.rating].count++;
      }
    }

    return counts;
  }, [ratings]);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="rating" tick={{ fontSize: 11 }} className="text-muted-foreground" />
        <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Responses">
          {data.map((entry) => (
            <Cell key={`cell-${entry.rating}`} fill={getRatingColor(entry.rating)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
