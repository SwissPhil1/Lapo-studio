import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { subDays, subMonths } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2 } from 'lucide-react';
import { BOOKING_STATUS } from '@/shared/lib/bookingStatus';

interface TreatmentBreakdownProps {
  dateRange: string;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(221, 83%, 53%)',
  'hsl(262, 83%, 58%)',
  'hsl(330, 81%, 60%)',
];

function getDateRange(range: string): Date {
  const end = new Date();
  
  switch (range) {
    case '7d':
      return subDays(end, 7);
    case '30d':
      return subDays(end, 30);
    case '90d':
      return subDays(end, 90);
    case '12m':
      return subMonths(end, 12);
    case 'ytd':
      return new Date(end.getFullYear(), 0, 1);
    default:
      return subMonths(end, 12);
  }
}

export function TreatmentBreakdown({ dateRange }: TreatmentBreakdownProps) {
  const start = getDateRange(dateRange);
  
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['treatment-breakdown', dateRange],
    queryFn: async () => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('service, booking_value')
        .eq('status', BOOKING_STATUS.COMPLETED)
        .gte('booking_date', start.toISOString());
      
      // Group by service
      const serviceData: Record<string, { count: number; revenue: number }> = {};
      
      bookings?.forEach(booking => {
        const service = booking.service || 'Autre';
        if (!serviceData[service]) {
          serviceData[service] = { count: 0, revenue: 0 };
        }
        serviceData[service].count += 1;
        serviceData[service].revenue += booking.booking_value || 0;
      });
      
      // Convert to array and sort by revenue
      const result = Object.entries(serviceData)
        .map(([name, data]) => ({
          name,
          count: data.count,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8); // Top 8 services
      
      return result;
    },
  });
  
  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }
  
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
  
  return (
    <div className="h-[300px] flex">
      <div className="w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="revenue"
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: any) => [`${value.toLocaleString()}€`, 'Revenus']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-1/2 flex flex-col justify-center space-y-2 pl-4">
        {chartData.slice(0, 5).map((item, index) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-foreground truncate max-w-[120px]" title={item.name}>
                {item.name}
              </span>
            </div>
            <div className="text-right">
              <span className="font-medium text-foreground">{item.revenue.toLocaleString()}€</span>
              <span className="text-muted-foreground ml-1">
                ({((item.revenue / totalRevenue) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        ))}
        {chartData.length > 5 && (
          <p className="text-xs text-muted-foreground">
            +{chartData.length - 5} autres traitements
          </p>
        )}
      </div>
    </div>
  );
}
