// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, Star, ArrowRight } from 'lucide-react';
import { BOOKING_STATUS } from '@/shared/lib/bookingStatus';

export function FirstTreatmentAnalysis() {
  const { data, isLoading } = useQuery({
    queryKey: ['first-treatment-analysis'],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('patient_id, service, booking_date, status')
        .eq('is_test', false)
        .eq('status', BOOKING_STATUS.COMPLETED)
        .order('booking_date', { ascending: true });

      if (error) throw error;

      // Get first booking per patient
      const firstBookings = new Map<string, { service: string; hasRepeat: boolean }>();
      const patientBookingCounts = new Map<string, number>();

      bookings?.forEach(b => {
        const count = patientBookingCounts.get(b.patient_id) || 0;
        patientBookingCounts.set(b.patient_id, count + 1);
        
        if (!firstBookings.has(b.patient_id)) {
          firstBookings.set(b.patient_id, { 
            service: b.service || 'Autre', 
            hasRepeat: false 
          });
        }
      });

      // Mark patients with repeat visits
      patientBookingCounts.forEach((count, patientId) => {
        if (count > 1) {
          const first = firstBookings.get(patientId);
          if (first) first.hasRepeat = true;
        }
      });

      // Aggregate by first treatment
      const treatmentStats = new Map<string, { total: number; repeats: number }>();
      
      firstBookings.forEach(({ service, hasRepeat }) => {
        const stats = treatmentStats.get(service) || { total: 0, repeats: 0 };
        stats.total++;
        if (hasRepeat) stats.repeats++;
        treatmentStats.set(service, stats);
      });

      // Format for charts
      const popularityData = Array.from(treatmentStats.entries())
        .map(([service, stats]) => ({
          service: service.length > 18 ? service.slice(0, 18) + '...' : service,
          fullName: service,
          count: stats.total,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      const retentionData = Array.from(treatmentStats.entries())
        .filter(([_, stats]) => stats.total >= 3) // Minimum sample size
        .map(([service, stats]) => ({
          service: service.length > 18 ? service.slice(0, 18) + '...' : service,
          fullName: service,
          rate: Math.round((stats.repeats / stats.total) * 100),
          count: stats.total,
        }))
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 5);

      return { popularityData, retentionData };
    },
  });

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.popularityData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }

  const colors = [
    'hsl(173, 58%, 35%)',
    'hsl(173, 58%, 42%)',
    'hsl(173, 58%, 49%)',
    'hsl(173, 58%, 56%)',
    'hsl(173, 58%, 63%)',
    'hsl(173, 58%, 70%)',
  ];

  return (
    <div className="space-y-6">
      {/* Most Popular First Treatments */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-medium text-muted-foreground">
            Premiers traitements les plus populaires
          </h4>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data.popularityData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis 
              type="category" 
              dataKey="service" 
              width={120}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value} patients`, 'Premiers RDV']}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.popularityData.map((_, index) => (
                <Cell key={index} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Treatments Leading to Repeat Visits */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ArrowRight className="h-4 w-4 text-success" />
          <h4 className="text-sm font-medium text-muted-foreground">
            Meilleur taux de fidélisation (1er traitement → retour)
          </h4>
        </div>
        {data.retentionData.length > 0 ? (
          <div className="space-y-2">
            {data.retentionData.map((item, i) => (
              <div key={i} className="bg-secondary/30 rounded-lg px-3 py-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-foreground">{item.service}</span>
                  <span className="text-sm font-bold text-success">{item.rate}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success rounded-full"
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{item.count} patients</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Pas assez de données (minimum 3 patients par traitement)
          </p>
        )}
      </div>
    </div>
  );
}
