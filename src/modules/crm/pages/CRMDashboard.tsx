import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/lib/supabase';
import { Users, AlertTriangle, Link2, Banknote, UserCheck, CalendarClock, Calendar } from 'lucide-react';
import { formatCurrency } from '@/shared/lib/constants';
import { BOOKING_STATUS } from '@/shared/lib/bookingStatus';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useReactivationTaskCounts, useReactivationTasks } from '@/shared/hooks/useReactivationTasks';
import { ReactivationTaskCard } from '@/modules/crm/components/tasks/ReactivationTaskCard';
import { CreateTaskDialog } from '@/modules/crm/components/tasks/CreateTaskDialog';
import { ActivityFeedWidget } from '@/modules/crm/components/dashboard/ActivityFeedWidget';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  onClick?: () => void;
  variant?: 'default' | 'warning' | 'success' | 'destructive';
}

function StatCard({ title, value, icon, subtitle, onClick, variant = 'default' }: StatCardProps) {
  const bgClass = variant === 'warning' 
    ? 'bg-warning/5 border-warning/20' 
    : variant === 'success' 
    ? 'bg-success/5 border-success/20' 
    : variant === 'destructive'
    ? 'bg-destructive/5 border-destructive/20'
    : '';
    
  return (
    <div 
      className={`card-elevated p-6 animate-slide-up ${bgClass} ${onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-sm mt-2 text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
          variant === 'warning' ? 'bg-warning/10' : 
          variant === 'success' ? 'bg-success/10' : 
          variant === 'destructive' ? 'bg-destructive/10' :
          'bg-accent'
        }`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { t, i18n } = useTranslation(['crmDashboard', 'common']);
  const dateLocale = i18n.language === 'fr' ? frLocale : enUS;
  
  // Monthly revenue
  const { data: monthlyRevenue = 0 } = useQuery({
    queryKey: ['monthly-revenue'],
    queryFn: async () => {
      const now = new Date();
      const start = startOfMonth(now).toISOString();
      const end = endOfMonth(now).toISOString();
      
      const { data } = await supabase
        .from('bookings')
        .select('booking_value')
        .eq('status', BOOKING_STATUS.COMPLETED)
        .eq('is_test', false)
        .gte('booking_date', start)
        .lte('booking_date', end);
      
      return data?.reduce((sum, b) => sum + (b.booking_value || 0), 0) || 0;
    },
  });

  // Appointments this week
  const { data: weeklyAppointments = 0 } = useQuery({
    queryKey: ['weekly-appointments'],
    queryFn: async () => {
      const now = new Date();
      const start = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const end = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
      
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', BOOKING_STATUS.SCHEDULED)
        .eq('is_test', false)
        .gte('booking_date', start)
        .lte('booking_date', end);
      
      return count || 0;
    },
  });

  // Active patients (booking in last 12 months)
  const { data: activePatients = 0 } = useQuery({
    queryKey: ['active-patients'],
    queryFn: async () => {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
      
      const { data } = await supabase
        .from('bookings')
        .select('patient_id')
        .eq('is_test', false)
        .gte('booking_date', twelveMonthsAgo.toISOString());
      
      const uniquePatients = new Set(data?.map(b => b.patient_id));
      return uniquePatients.size;
    },
  });

  // Retention rate (patients with 2+ bookings / total patients with any booking)
  const { data: retentionRate = 0 } = useQuery({
    queryKey: ['retention-rate'],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select('patient_id')
        .eq('is_test', false);
      
      if (!data || data.length === 0) return 0;
      
      const patientBookings: Record<string, number> = {};
      data.forEach(b => {
        patientBookings[b.patient_id] = (patientBookings[b.patient_id] || 0) + 1;
      });
      
      const totalPatients = Object.keys(patientBookings).length;
      const returningPatients = Object.values(patientBookings).filter(count => count >= 2).length;
      
      return totalPatients > 0 ? Math.round((returningPatients / totalPatients) * 100) : 0;
    },
  });

  // Today's appointments
  const { data: todayAppointments = [] } = useQuery({
    queryKey: ['today-appointments'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data } = await supabase
        .from('bookings')
        .select('id, booking_date, service, status, patient_id, patients!bookings_patient_id_fkey(first_name, last_name)')
        .gte('booking_date', `${today}T00:00:00.000Z`)
        .lt('booking_date', `${today}T23:59:59.999Z`)
        .eq('is_test', false)
        .order('booking_date', { ascending: true });
      
      return data || [];
    },
  });

  // Unprocessed past bookings (should be rare with automated webhooks)
  const { data: needsAttentionCount = 0 } = useQuery({
    queryKey: ['needs-attention-count'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', BOOKING_STATUS.SCHEDULED)
        .eq('is_test', false)
        .lt('booking_date', today);
      return count || 0;
    },
  });

  // Count distinct patients with unprocessed bookings
  const { data: needsAttentionPatients = 0 } = useQuery({
    queryKey: ['needs-attention-patients-count'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('bookings')
        .select('patient_id')
        .eq('status', BOOKING_STATUS.SCHEDULED)
        .eq('is_test', false)
        .lt('booking_date', today);
      const uniquePatients = new Set(data?.map(b => b.patient_id) || []);
      return uniquePatients.size;
    },
  });

  // No-show bookings
  const { data: noShowCount = 0 } = useQuery({
    queryKey: ['no-show-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', BOOKING_STATUS.NO_SHOW)
        .eq('is_test', false);
      return count || 0;
    },
  });

  // Reactivation task counts
  const { data: taskCounts = { overdue_recall: 0, dormant: 0, no_show_followup: 0, manual: 0, total: 0 } } = useReactivationTaskCounts();

  // Get pending reactivation tasks for display
  const { data: pendingTasks = [] } = useReactivationTasks({
    status: ['pending', 'in_progress'],
  });

  // Unmapped services (admin only)
  const { data: unmappedServicesCount = 0 } = useQuery({
    queryKey: ['unmapped-services-count'],
    enabled: isAdmin,
    queryFn: async () => {
      const { count } = await supabase
        .from('service_mappings')
        .select('*', { count: 'exact', head: true })
        .is('treatment_protocol_id', null);
      return count || 0;
    },
  });

  const totalAttentionItems = needsAttentionCount + noShowCount;

  return (
    <div className="space-y-6">
      {/* Unmapped Services Warning (Admin only) */}
      {isAdmin && unmappedServicesCount > 0 && (
        <div 
          className="card-elevated p-4 bg-warning/5 border-warning/20 cursor-pointer hover:bg-warning/10 transition-colors"
          onClick={() => navigate('/crm/settings')}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {t('crmDashboard:unmappedServices', { count: unmappedServicesCount })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('crmDashboard:unmappedServicesDesc')}
              </p>
            </div>
            <span className="text-sm text-primary font-medium">{t('crmDashboard:configure')} →</span>
          </div>
        </div>
      )}

      {/* Needs Attention Alert */}
      {totalAttentionItems > 0 && (
        <div 
          className="card-elevated p-4 bg-warning/5 border-warning/20 cursor-pointer hover:bg-warning/10 transition-colors"
          onClick={() => navigate('/crm/manual-corrections')}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {t('crmDashboard:appointmentsToProcess', { count: totalAttentionItems })}
                {needsAttentionPatients > 0 && ` (${t('crmDashboard:patients', { count: needsAttentionPatients })})`}
              </p>
              <p className="text-sm text-muted-foreground">
                {needsAttentionCount > 0 && t('crmDashboard:unprocessedAppointments', { count: needsAttentionCount })}
                {needsAttentionCount > 0 && noShowCount > 0 && ' • '}
                {noShowCount > 0 && t('crmDashboard:noShows', { count: noShowCount })}
              </p>
            </div>
            <span className="text-sm text-primary font-medium">{t('crmDashboard:process')} →</span>
          </div>
        </div>
      )}


      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('crmDashboard:activePatients')}
          value={activePatients}
          icon={<Users className="h-6 w-6 text-primary" />}
          subtitle={t('crmDashboard:last12Months')}
        />
        <StatCard
          title={t('crmDashboard:monthlyRevenue')}
          value={formatCurrency(monthlyRevenue)}
          icon={<Banknote className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title={t('crmDashboard:weeklyAppointments')}
          value={weeklyAppointments}
          icon={<CalendarClock className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title={t('crmDashboard:retentionRate')}
          value={`${retentionRate}%`}
          icon={<UserCheck className="h-6 w-6 text-primary" />}
          subtitle={t('crmDashboard:patientsWithMultipleAppts')}
        />
      </div>

      {/* Reactivation Tasks Section */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            {t('crmDashboard:followUps')} ({pendingTasks.length})
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex gap-2 text-sm">
              {taskCounts.overdue_recall > 0 && (
                <span className="px-2 py-1 rounded bg-destructive/10 text-destructive">
                  {t('crmDashboard:recalls', { count: taskCounts.overdue_recall })}
                </span>
              )}
              {taskCounts.dormant > 0 && (
                <span className="px-2 py-1 rounded bg-warning/10 text-warning">
                  {t('crmDashboard:inactive', { count: taskCounts.dormant })}
                </span>
              )}
              {taskCounts.no_show_followup > 0 && (
                <span className="px-2 py-1 rounded bg-warning/10 text-warning">
                  {t('crmDashboard:noShows', { count: taskCounts.no_show_followup })}
                </span>
              )}
              {taskCounts.manual > 0 && (
                <span className="px-2 py-1 rounded bg-primary/10 text-primary">
                  {t('crmDashboard:manual', { count: taskCounts.manual })}
                </span>
              )}
            </div>
            <CreateTaskDialog />
          </div>
        </div>
        {pendingTasks.length > 0 ? (
          <div className="space-y-2">
            {pendingTasks.slice(0, 5).map((task) => (
              <ReactivationTaskCard key={task.id} task={task} />
            ))}
            {pendingTasks.length > 5 && (
              <button 
                onClick={() => navigate('/crm/patients?filter=overdue')}
                className="w-full text-center text-sm text-primary hover:underline py-2"
              >
                {t('crmDashboard:viewMore', { count: pendingTasks.length - 5 })} →
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p>{t('crmDashboard:noFollowUps')}</p>
          </div>
        )}
      </div>

      {/* Today's Appointments */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            {t('crmDashboard:todayAppointments')} ({todayAppointments.length})
          </h3>
          <span className="text-sm text-muted-foreground">
            {format(new Date(), 'EEEE d MMMM', { locale: dateLocale })}
          </span>
        </div>
        
        {todayAppointments.length > 0 ? (
          <div className="space-y-2">
            {todayAppointments.map((apt: any) => (
              <div 
                key={apt.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/crm/patients/${apt.patient_id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${
                    apt.status === BOOKING_STATUS.COMPLETED ? 'bg-success' :
                    apt.status === BOOKING_STATUS.NO_SHOW ? 'bg-destructive' :
                    'bg-primary'
                  }`} />
                  <div>
                    <p className="font-medium text-foreground">
                      {apt.patients?.first_name} {apt.patients?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{apt.service}</p>
                  </div>
                </div>
                <span className={`text-sm px-2 py-1 rounded ${
                  apt.status === BOOKING_STATUS.COMPLETED ? 'bg-success/10 text-success' :
                  apt.status === BOOKING_STATUS.NO_SHOW ? 'bg-destructive/10 text-destructive' :
                  'bg-primary/10 text-primary'
                }`}>
                  {apt.status === BOOKING_STATUS.COMPLETED ? t('crmDashboard:statusPaid') :
                   apt.status === BOOKING_STATUS.NO_SHOW ? t('crmDashboard:statusAbsent') :
                   apt.status === BOOKING_STATUS.CANCELLED ? t('crmDashboard:statusCancelled') :
                   t('crmDashboard:statusScheduled')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t('crmDashboard:noAppointmentsToday')}</p>
          </div>
        )}
      </div>

      {/* Activity Feed */}
      <ActivityFeedWidget 
        limit={20} 
        collapsedLimit={5} 
        showHeader={true}
      />

    </div>
  );
}
