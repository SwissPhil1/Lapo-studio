// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2, CheckCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { BOOKING_STATUS } from '@/shared/lib/bookingStatus';
import { 
  getOverallRecallStatusWithMappings, 
  type ServiceMapping, 
  type TreatmentProtocol,
  type BookingWithService 
} from '@/shared/lib/recallUtils';

const COLORS = {
  onTrack: 'hsl(var(--success))',
  scheduled: 'hsl(var(--success))',
  dueSoon: 'hsl(var(--warning))',
  overdue: 'hsl(var(--destructive))',
  inFollowup: 'hsl(var(--primary))',
  noData: 'hsl(var(--muted))',
};

export function RecallMetrics() {
  const { data, isLoading } = useQuery({
    queryKey: ['recall-metrics-enhanced'],
    queryFn: async () => {
      // Fetch service mappings and treatment protocols
      const [serviceMappingsResult, protocolsResult, patientsResult] = await Promise.all([
        supabase
          .from('service_mappings')
          .select('service_name, treatment_protocol_id, treatment_protocols(treatment_type, recall_interval_days)'),
        supabase
          .from('treatment_protocols')
          .select('treatment_type, recall_interval_days'),
        supabase
          .from('patients')
          .select('id'),
      ]);
      
      const serviceMappings: ServiceMapping[] = (serviceMappingsResult.data || []) as ServiceMapping[];
      const treatmentProtocols: TreatmentProtocol[] = (protocolsResult.data || []) as TreatmentProtocol[];
      const patients = patientsResult.data;
      
      if (!patients || patients.length === 0) {
        return { onTrack: 0, dueSoon: 0, overdue: 0, inFollowup: 0, noData: 0, total: 0 };
      }
      
      // Get all bookings for patients
      const patientIds = patients.map(p => p.id);
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const { data: bookings } = await supabase
        .from('bookings')
        .select('patient_id, booking_date, status, service')
        .in('patient_id', patientIds);
      
      // Group bookings by patient
      const bookingsByPatient: Record<string, BookingWithService[]> = {};
      bookings?.forEach(booking => {
        if (!bookingsByPatient[booking.patient_id]) {
          bookingsByPatient[booking.patient_id] = [];
        }
        bookingsByPatient[booking.patient_id].push({
          booking_date: booking.booking_date,
          service: booking.service,
          status: booking.status || undefined,
        });
      });
      
      // Categorize patients using the proper recall logic
      let onTrack = 0;
      let dueSoon = 0;
      let overdue = 0;
      let inFollowup = 0;
      let noData = 0;
      
      patients.forEach(patient => {
        const patientBookings = bookingsByPatient[patient.id] || [];
        
        // Split into past (completed) and upcoming bookings
        const pastBookings = patientBookings
          .filter(b => b.status === BOOKING_STATUS.COMPLETED)
          .sort((a, b) => b.booking_date.localeCompare(a.booking_date));
        
        const upcomingBookings = patientBookings
          .filter(b => {
            const bookingDateStr = b.booking_date.split('T')[0].split(' ')[0];
            return bookingDateStr >= todayStr && b.status === BOOKING_STATUS.SCHEDULED;
          })
          .sort((a, b) => a.booking_date.localeCompare(b.booking_date));
        
        // Calculate recall status using the proper function
        const recallStatus = getOverallRecallStatusWithMappings(
          pastBookings,
          upcomingBookings,
          serviceMappings,
          treatmentProtocols
        );
        
        switch (recallStatus) {
          case 'scheduled':
          case 'on_track':
            onTrack++;
            break;
          case 'due_soon':
            dueSoon++;
            break;
          case 'overdue':
            overdue++;
            break;
          case 'in_followup':
            inFollowup++;
            break;
          default:
            noData++;
        }
      });
      
      return {
        onTrack,
        dueSoon,
        overdue,
        inFollowup,
        noData,
        total: patients.length,
      };
    },
  });
  
  if (isLoading) {
    return (
      <div className="h-[250px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!data || data.total === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Aucun patient enregistré</p>
        </div>
      </div>
    );
  }
  
  const chartData = [
    { name: 'À jour', value: data.onTrack, color: COLORS.onTrack },
    { name: 'Bientôt dû', value: data.dueSoon, color: COLORS.dueSoon },
    { name: 'En retard', value: data.overdue, color: COLORS.overdue },
    { name: 'En suivi', value: data.inFollowup, color: COLORS.inFollowup },
    { name: 'Sans données', value: data.noData, color: COLORS.noData },
  ].filter(item => item.value > 0);
  
  return (
    <div className="flex items-center">
      <div className="w-1/2">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [value, 'Patients']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="w-1/2 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-foreground">À jour</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-foreground">{data.onTrack}</span>
            <span className="text-muted-foreground text-sm ml-1">
              ({((data.onTrack / data.total) * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm text-foreground">Bientôt dû</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-foreground">{data.dueSoon}</span>
            <span className="text-muted-foreground text-sm ml-1">
              ({((data.dueSoon / data.total) * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-foreground">En retard</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-foreground">{data.overdue}</span>
            <span className="text-muted-foreground text-sm ml-1">
              ({((data.overdue / data.total) * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
        
        {data.inFollowup > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">En suivi</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-foreground">{data.inFollowup}</span>
              <span className="text-muted-foreground text-sm ml-1">
                ({((data.inFollowup / data.total) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        )}
        
        {data.noData > 0 && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm">Sans données</span>
            <span className="text-sm">{data.noData}</span>
          </div>
        )}
      </div>
    </div>
  );
}
