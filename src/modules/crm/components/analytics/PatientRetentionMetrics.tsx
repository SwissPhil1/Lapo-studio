import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2, UserCheck, UserX, RefreshCw, Clock } from 'lucide-react';
import { differenceInDays, subMonths } from 'date-fns';
import { BOOKING_STATUS } from '@/shared/lib/bookingStatus';

export function PatientRetentionMetrics() {
  const { data, isLoading } = useQuery({
    queryKey: ['patient-retention'],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('patient_id, booking_date, status')
        .eq('is_test', false)
        .eq('status', BOOKING_STATUS.COMPLETED)
        .order('booking_date', { ascending: true });

      if (error) throw error;

      const today = new Date();
      const oneYearAgo = subMonths(today, 12);
      const sixMonthsAgo = subMonths(today, 6);

      // Group bookings by patient
      const patientBookings = new Map<string, Date[]>();
      bookings?.forEach(b => {
        const dates = patientBookings.get(b.patient_id) || [];
        dates.push(new Date(b.booking_date));
        patientBookings.set(b.patient_id, dates);
      });

      // Calculate metrics
      let newPatients = 0; // First booking in last 12 months
      let returningPatients = 0; // Multiple bookings
      let churnedPatients = 0; // No booking in last 12 months but had before
      let activePatients = 0; // At least one booking in last 6 months

      const avgIntervals: number[] = [];

      patientBookings.forEach((dates, _patientId) => {
        const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
        const firstBooking = sortedDates[0];
        const lastBooking = sortedDates[sortedDates.length - 1];

        // New vs returning
        if (firstBooking >= oneYearAgo) {
          newPatients++;
        }
        if (sortedDates.length > 1) {
          returningPatients++;
          
          // Calculate average interval between appointments
          for (let i = 1; i < sortedDates.length; i++) {
            avgIntervals.push(differenceInDays(sortedDates[i], sortedDates[i-1]));
          }
        }

        // Churned
        if (lastBooking < oneYearAgo && firstBooking < oneYearAgo) {
          churnedPatients++;
        }

        // Active
        if (lastBooking >= sixMonthsAgo) {
          activePatients++;
        }
      });

      const totalPatients = patientBookings.size;
      const retentionRate = totalPatients > 0 
        ? Math.round((returningPatients / totalPatients) * 100) 
        : 0;
      const churnRate = totalPatients > 0 
        ? Math.round((churnedPatients / totalPatients) * 100) 
        : 0;
      const avgInterval = avgIntervals.length > 0 
        ? Math.round(avgIntervals.reduce((a, b) => a + b, 0) / avgIntervals.length) 
        : 0;

      const pieData = [
        { name: 'Fidèles', value: returningPatients, color: 'hsl(152, 69%, 40%)' },
        { name: 'Nouveaux', value: newPatients - (returningPatients > newPatients ? 0 : newPatients), color: 'hsl(173, 58%, 39%)' },
        { name: 'Inactifs', value: churnedPatients, color: 'hsl(0, 72%, 51%)' },
      ].filter(d => d.value > 0);

      return {
        totalPatients,
        returningPatients,
        newPatients,
        activePatients,
        churnedPatients,
        retentionRate,
        churnRate,
        avgInterval,
        pieData,
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
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-success/10 rounded-lg p-3 text-center">
          <UserCheck className="h-4 w-4 mx-auto text-success mb-1" />
          <p className="text-xl font-bold text-foreground">{data.retentionRate}%</p>
          <p className="text-xs text-muted-foreground">Taux rétention</p>
        </div>
        <div className="bg-destructive/10 rounded-lg p-3 text-center">
          <UserX className="h-4 w-4 mx-auto text-destructive mb-1" />
          <p className="text-xl font-bold text-foreground">{data.churnRate}%</p>
          <p className="text-xs text-muted-foreground">Taux churn</p>
        </div>
        <div className="bg-primary/10 rounded-lg p-3 text-center">
          <RefreshCw className="h-4 w-4 mx-auto text-primary mb-1" />
          <p className="text-xl font-bold text-foreground">{data.returningPatients}</p>
          <p className="text-xs text-muted-foreground">Patients fidèles</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-xl font-bold text-foreground">{data.avgInterval}j</p>
          <p className="text-xs text-muted-foreground">Intervalle moyen</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Pie Chart */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Répartition patients</h4>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={data.pieData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                dataKey="value"
              >
                {data.pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs">
            {data.pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Détails</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total patients</span>
              <span className="font-medium text-foreground">{data.totalPatients}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Actifs (6 mois)</span>
              <span className="font-medium text-foreground">{data.activePatients}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nouveaux (12 mois)</span>
              <span className="font-medium text-foreground">{data.newPatients}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inactifs</span>
              <span className="font-medium text-destructive">{data.churnedPatients}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
