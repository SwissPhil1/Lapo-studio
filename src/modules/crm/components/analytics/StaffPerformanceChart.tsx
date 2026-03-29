import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/shared/lib/constants';
import { BOOKING_STATUS } from '@/shared/lib/bookingStatus';

interface StaffPerformanceChartProps {
  dateRange: string;
}

export function StaffPerformanceChart({ dateRange }: StaffPerformanceChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['staff-performance', dateRange],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          booking_value,
          status,
          profile_id,
          profiles:profile_id (
            id,
            full_name,
            email
          )
        `)
        .eq('is_test', false)
        .not('profile_id', 'is', null);

      if (error) throw error;

      // Aggregate by staff member
      const staffMap = new Map<string, {
        name: string;
        revenue: number;
        appointments: number;
        completed: number;
      }>();

      bookings?.forEach((booking: any) => {
        const staffId = booking.profile_id;
        const staffName = booking.profiles?.full_name || booking.profiles?.email || 'Inconnu';
        
        if (!staffMap.has(staffId)) {
          staffMap.set(staffId, {
            name: staffName,
            revenue: 0,
            appointments: 0,
            completed: 0,
          });
        }
        
        const staff = staffMap.get(staffId)!;
        staff.appointments += 1;
        if (booking.status === BOOKING_STATUS.COMPLETED) {
          staff.revenue += booking.booking_value || 0;
          staff.completed += 1;
        }
      });

      return Array.from(staffMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(s => ({
          ...s,
          completionRate: s.appointments > 0 ? Math.round((s.completed / s.appointments) * 100) : 0,
          avgValue: s.completed > 0 ? Math.round(s.revenue / s.completed) : 0,
        }));
    },
  });

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }

  const colors = [
    '#7C3AED', // violet
    '#FF2E93', // pink
    '#06B6D4', // cyan
    '#FF6B6B', // coral
    '#BFFF00', // lime
  ];

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 80, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            type="number" 
            tickFormatter={(v) => formatCurrency(v)}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={70}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + '...' : v}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: any, _name: any) => [formatCurrency(value), 'Revenus']}
            labelFormatter={(label) => label}
          />
          <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {data.slice(0, 4).map((staff, i) => (
          <div key={i} className="bg-secondary/50 rounded-lg p-3">
            <p className="font-medium text-foreground truncate">{staff.name}</p>
            <p className="text-muted-foreground">{staff.appointments} RDV</p>
            <p className="text-muted-foreground">{staff.completionRate}% complétés</p>
          </div>
        ))}
      </div>
    </div>
  );
}
