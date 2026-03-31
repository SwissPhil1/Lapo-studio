import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { type SatisfactionRating, computeNPS } from './SatisfactionWidget';

interface NPSTrendChartProps {
  ratings: SatisfactionRating[];
}

export function NPSTrendChart({ ratings }: NPSTrendChartProps) {
  const data = useMemo(() => {
    const now = new Date();
    const months: { label: string; nps: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = d.toLocaleDateString('fr-CH', { month: 'short', year: '2-digit' });

      const monthRatings = ratings.filter((r) => {
        const rd = new Date(r.created_at);
        return rd.getFullYear() === year && rd.getMonth() === month;
      });

      const { nps } = computeNPS(monthRatings);
      months.push({ label, nps: monthRatings.length > 0 ? nps : 0 });
    }

    return months;
  }, [ratings]);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
        <YAxis domain={[-100, 100]} tick={{ fontSize: 11 }} className="text-muted-foreground" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="nps"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          name="NPS"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
