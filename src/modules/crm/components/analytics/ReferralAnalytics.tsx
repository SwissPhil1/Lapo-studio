import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, Users, TrendingUp, Banknote } from 'lucide-react';
import { formatCurrency } from '@/shared/lib/constants';

interface ReferralAnalyticsProps {
  dateRange: string;
}

export function ReferralAnalytics({ dateRange }: ReferralAnalyticsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['referral-analytics', dateRange],
    queryFn: async () => {
      // Get referral stats
      const { data: referrals, error: refError } = await supabase
        .from('referrals')
        .select('id, status, referrer_code')
        .eq('is_test', false);

      if (refError) throw refError;

      // Get bookings with referrer codes
      const { data: referredBookings, error: bookError } = await supabase
        .from('bookings')
        .select('booking_value, referrer_code')
        .eq('is_test', false)
        .not('referrer_code', 'is', null);

      if (bookError) throw bookError;

      // Calculate funnel
      const total = referrals?.length || 0;
      const confirmed = referrals?.filter(r => r.status === 'confirmed').length || 0;
      const booked = referredBookings?.length || 0;

      const funnelData = [
        { name: 'Référés', value: total, fill: '#7C3AED' },
        { name: 'Confirmés', value: confirmed, fill: '#06B6D4' },
        { name: 'Réservés', value: booked, fill: '#22C55E' },
      ];

      // Revenue from referrals
      const referralRevenue = referredBookings?.reduce((sum, b) => sum + (b.booking_value || 0), 0) || 0;

      // Top referrers with revenue
      const referrerMap = new Map<string, { count: number; revenue: number }>();
      referrals?.forEach(r => {
        const existing = referrerMap.get(r.referrer_code) || { count: 0, revenue: 0 };
        existing.count++;
        referrerMap.set(r.referrer_code, existing);
      });

      // Add revenue per referrer
      referredBookings?.forEach(b => {
        if (b.referrer_code) {
          const existing = referrerMap.get(b.referrer_code);
          if (existing) {
            existing.revenue += b.booking_value || 0;
          }
        }
      });

      const topReferrers = Array.from(referrerMap.entries())
        .map(([code, data]) => ({
          code,
          count: data.count,
          revenue: data.revenue,
          avgValue: data.count > 0 ? Math.round(data.revenue / data.count) : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const avgRevenuePerReferral = total > 0 ? Math.round(referralRevenue / total) : 0;

      return {
        funnelData,
        referralRevenue,
        totalReferrals: total,
        conversionRate: total > 0 ? Math.round((booked / total) * 100) : 0,
        topReferrers,
        avgRevenuePerReferral,
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
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <Users className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">{data.totalReferrals}</p>
          <p className="text-sm text-muted-foreground">Total référés</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto text-success mb-2" />
          <p className="text-2xl font-bold text-foreground">{data.conversionRate}%</p>
          <p className="text-sm text-muted-foreground">Taux conversion</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <Banknote className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">{formatCurrency(data.referralRevenue)}</p>
          <p className="text-sm text-muted-foreground">Revenus parrainés</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <Banknote className="h-5 w-5 mx-auto text-success mb-2" />
          <p className="text-2xl font-bold text-foreground">{formatCurrency(data.avgRevenuePerReferral)}</p>
          <p className="text-sm text-muted-foreground">Rev. moy / référé</p>
        </div>
      </div>

      {/* Funnel Chart */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Entonnoir de conversion</h4>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data.funnelData} layout="vertical">
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={80}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.funnelData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Referrers with ROI */}
      {data.topReferrers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Top 5 parrains — ROI</h4>
          <div className="space-y-2">
            {data.topReferrers.map((ref, i) => (
              <div key={i} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-foreground">{ref.code}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{ref.count} référés</span>
                  <span className="text-success font-medium">{formatCurrency(ref.revenue)}</span>
                  <span className="text-xs text-muted-foreground">~{formatCurrency(ref.avgValue)}/réf</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
