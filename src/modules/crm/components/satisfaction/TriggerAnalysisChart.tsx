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
import { type SatisfactionRating, type TriggerType, computeNPS } from './SatisfactionWidget';

interface TriggerAnalysisChartProps {
  ratings: SatisfactionRating[];
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  post_booking: 'Post-booking',
  post_referral_reward: 'Referral reward',
  post_campaign: 'Post-campaign',
  periodic: 'Periodic',
};

const TRIGGER_COLORS: Record<TriggerType, string> = {
  post_booking: '#6366f1',
  post_referral_reward: '#10b981',
  post_campaign: '#f59e0b',
  periodic: '#8b5cf6',
};

export function TriggerAnalysisChart({ ratings }: TriggerAnalysisChartProps) {
  const data = useMemo(() => {
    const triggers: TriggerType[] = ['post_booking', 'post_referral_reward', 'post_campaign', 'periodic'];

    return triggers.map((trigger) => {
      const triggerRatings = ratings.filter((r) => r.trigger_type === trigger);
      const { nps } = computeNPS(triggerRatings);
      const avg =
        triggerRatings.length > 0
          ? +(triggerRatings.reduce((sum, r) => sum + r.rating, 0) / triggerRatings.length).toFixed(1)
          : 0;

      return {
        trigger,
        label: TRIGGER_LABELS[trigger],
        nps,
        avg,
        count: triggerRatings.length,
        color: TRIGGER_COLORS[trigger],
      };
    });
  }, [ratings]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis type="number" domain={[-100, 100]} tick={{ fontSize: 11 }} className="text-muted-foreground" />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} className="text-muted-foreground" width={95} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [String(value), 'NPS']}
        />
        <Bar dataKey="nps" radius={[0, 4, 4, 0]} name="nps">
          {data.map((entry) => (
            <Cell key={entry.trigger} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
