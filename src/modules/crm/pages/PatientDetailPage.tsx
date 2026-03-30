import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared/lib/supabase';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Phone, Calendar, Loader2, MapPin, Check, X, UserX, Pencil, Trash2, TrendingUp, BarChart3, CalendarDays, MessageSquare, Activity } from 'lucide-react';
import { UnifiedTimeline } from '@/modules/crm/components/patients/UnifiedTimeline';
import { formatCurrency } from '@/shared/lib/constants';
import { format, parseISO, differenceInDays } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { ReferralBanner } from '@/modules/crm/components/patients/ReferralBanner';
import { TreatmentTimeline } from '@/modules/crm/components/patients/TreatmentTimeline';
import { RecallStatusBadge } from '@/modules/crm/components/patients/RecallStatusBadge';
import { QuickActionBar } from '@/modules/crm/components/patients/QuickActionBar';
import { PatientSidebar } from '@/modules/crm/components/patients/PatientSidebar';
import { StageSelector } from '@/modules/crm/components/patients/StageSelector';
import { CommunicationsHistory } from '@/modules/crm/components/patients/CommunicationsHistory';
import { 
  getOverallRecallStatusWithMappings, 
  getRecallDaysForService, 
  type ServiceMapping,
  type TreatmentProtocol 
} from '@/shared/lib/recallUtils';
import { useToast } from '@/shared/hooks/use-toast';
import { 
  BOOKING_STATUS, 
  getStatusLabel, 
  getStatusColors,
  isPastBookingUnprocessed 
} from '@/shared/lib/bookingStatus';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PatientDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  tags: string[] | null;
  created_at: string;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
}

interface Referral {
  referrer_code: string;
  discount_percent: number | null;
  expires_at: string | null;
  referrers: {
    referrer_name: string;
  }[] | null;
}

interface Booking {
  id: string;
  booking_date: string;
  service: string;
  status: string;
  booking_value: number;
}

interface CRMNote {
  id: string;
  title: string;
  content: string;
  note_type: string;
  priority: string;
  created_at: string;
}

interface PipelinePatient {
  stage_id: string;
  entered_at: string;
  pipeline_stages: {
    id: string;
    name: string;
    color: string;
    order_index: number;
  } | null;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order_index: number;
}

export default function PatientDetail() {
  const { t, i18n } = useTranslation(['patientDetail', 'common']);
  const dateLocale = i18n.language === 'fr' ? frLocale : enUS;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // UI State
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [editNoteOpen, setEditNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CRMNote | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isDeletingNote, setIsDeletingNote] = useState<string | null>(null);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);

  // Booking status update mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);
      if (error) throw error;
      return status;
    },
    onMutate: ({ bookingId }) => {
      setUpdatingBookingId(bookingId);
    },
    onSuccess: (status) => {
      const statusKeys: Record<string, string> = {
        [BOOKING_STATUS.COMPLETED]: 'completed',
        [BOOKING_STATUS.NO_SHOW]: 'noShow',
        [BOOKING_STATUS.CANCELLED]: 'cancelled',
      };
      const statusKey = statusKeys[status] || status;
      toast({ title: t('patientDetail:toast.success'), description: t('patientDetail:toast.markedAs', { status: t(`patientDetail:bookingStatus.${statusKey}`) }) });
      queryClient.invalidateQueries({ queryKey: ['patient-detail', id] });
    },
    onError: (error: Error) => {
      toast({ title: t('patientDetail:toast.error'), description: error.message, variant: 'destructive' });
    },
    onSettled: () => {
      setUpdatingBookingId(null);
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['patient-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Patient ID is required');

      // Fetch patient
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (patientError) throw patientError;

      // Fetch referral info
      const { data: referralData } = await supabase
        .from('referrals')
        .select('referrer_code, discount_percent, expires_at, referrers(referrer_name)')
        .eq('referred_patient_id', id)
        .maybeSingle();

      // Fetch bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('id, booking_date, service, status, booking_value')
        .eq('patient_id', id)
        .order('booking_date', { ascending: false });

      // Fetch CRM notes
      const { data: notesData } = await supabase
        .from('crm_notes')
        .select('id, title, content, note_type, priority, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      // Fetch treatment protocols for recall intervals
      const { data: protocolsData } = await supabase
        .from('treatment_protocols')
        .select('treatment_type, recall_interval_days');

      // Fetch service mappings with their protocols
      const { data: serviceMappingsData } = await supabase
        .from('service_mappings')
        .select('service_name, treatment_protocol_id, treatment_protocols(treatment_type, recall_interval_days)');

      // Fetch patient's pipeline stage
      const { data: pipelinePatientData } = await supabase
        .from('pipeline_patients')
        .select('stage_id, entered_at, pipeline_stages(id, name, color, order_index)')
        .eq('patient_id', id)
        .maybeSingle();

      // Fetch all active pipeline stages for visualization
      const { data: allStagesData } = await supabase
        .from('pipeline_stages')
        .select('id, name, color, order_index')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
        
      return {
        patient: patient as PatientDetail,
        referral: referralData as Referral | null,
        bookings: (bookingsData || []) as Booking[],
        notes: (notesData || []) as CRMNote[],
        protocols: (protocolsData || []) as TreatmentProtocol[],
        serviceMappings: (serviceMappingsData || []) as ServiceMapping[],
        pipelinePatient: pipelinePatientData as unknown as PipelinePatient | null,
        allStages: (allStagesData || []) as PipelineStage[],
      };
    },
    enabled: !!id,
  });

  // Fetch recent communications (last 7 days) for alert logic
  const { data: recentCommunications } = useQuery({
    queryKey: ['patient-recent-comms', id],
    queryFn: async () => {
      if (!id) return [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data } = await supabase
        .from('crm_communication_logs')
        .select('id, channel, created_at, status')
        .eq('patient_id', id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  // Helper to format relative time
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (i18n.language === 'fr') {
      if (diffMinutes < 60) return "il y a moins d'une heure";
      if (diffHours < 24) return `il y a ${diffHours}h`;
      if (diffDays === 1) return 'hier';
      return `il y a ${diffDays} jours`;
    }
    if (diffMinutes < 60) return 'less than an hour ago';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  };

  const handleAddNote = async () => {
    if (!noteContent.trim() || !id) return;
    
    setIsSubmittingNote(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('crm_notes')
        .insert({
          user_id: id,
          title: noteTitle.trim() || 'Note',
          content: noteContent.trim(),
          note_type: noteType,
          priority: 'normal',
          created_by: user?.id || null,
        });
      
      if (error) throw error;
      
      toast({ title: t('patientDetail:notes.noteAdded') });
      setAddNoteOpen(false);
      setNoteTitle('');
      setNoteContent('');
      setNoteType('general');
      queryClient.invalidateQueries({ queryKey: ['patient-detail', id] });
    } catch (error: any) {
      toast({ title: t('patientDetail:toast.error'), description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleEditNote = async () => {
    if (!noteContent.trim() || !editingNote) return;
    
    setIsSubmittingNote(true);
    try {
      const { error } = await supabase
        .from('crm_notes')
        .update({
          title: noteTitle.trim() || 'Note',
          content: noteContent.trim(),
          note_type: noteType,
        })
        .eq('id', editingNote.id);
      
      if (error) throw error;
      
      toast({ title: t('patientDetail:notes.noteEdited') });
      setEditNoteOpen(false);
      setEditingNote(null);
      setNoteTitle('');
      setNoteContent('');
      setNoteType('general');
      queryClient.invalidateQueries({ queryKey: ['patient-detail', id] });
    } catch (error: any) {
      toast({ title: t('patientDetail:toast.error'), description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setIsDeletingNote(noteId);
    try {
      const { error } = await supabase
        .from('crm_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({ title: t('patientDetail:notes.noteDeleted') });
      queryClient.invalidateQueries({ queryKey: ['patient-detail', id] });
    } catch (error: any) {
      toast({ title: t('patientDetail:toast.error'), description: error.message, variant: 'destructive' });
    } finally {
      setIsDeletingNote(null);
    }
  };

  const openEditNote = (note: CRMNote) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteType(note.note_type);
    setEditNoteOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card-elevated p-8 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">{t('patientDetail:notFound')}</h3>
        <p className="text-muted-foreground mb-4">{t('patientDetail:notFoundDesc')}</p>
        <Button variant="outline" onClick={() => navigate('/crm/patients')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('patientDetail:backToPatients')}
        </Button>
      </div>
    );
  }

  const { patient, referral, bookings, notes, protocols, serviceMappings, pipelinePatient, allStages } = data;

  // Calculate metrics
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const lifetimeValue = completedBookings.reduce((sum, b) => sum + b.booking_value, 0);
  const lastCompletedBooking = completedBookings[0];
  const today = new Date();
  const upcomingBookings = bookings.filter(b => parseISO(b.booking_date) > today && b.status !== 'cancelled');
  const nextAppointment = upcomingBookings.length > 0 
    ? upcomingBookings.sort((a, b) => parseISO(a.booking_date).getTime() - parseISO(b.booking_date).getTime())[0]
    : null;

  // Group bookings by treatment type for timeline
  const treatmentGroups = bookings.reduce((acc, booking) => {
    const type = booking.service || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  // Get recall interval for each treatment type using service mappings
  const getRecallDays = (treatmentType: string) => {
    return getRecallDaysForService(treatmentType, serviceMappings, protocols);
  };

  // Calculate recall status for Patient Journey using service mappings
  const completedWithService = completedBookings.map(b => ({
    booking_date: b.booking_date,
    service: b.service,
  }));
  const recallStatus = getOverallRecallStatusWithMappings(
    completedWithService, 
    upcomingBookings, 
    serviceMappings, 
    protocols
  );

  // Build formatted address
  const addressParts = [
    patient.address_line_1,
    patient.address_line_2,
    [patient.postal_code, patient.city].filter(Boolean).join(' '),
    patient.country,
  ].filter(Boolean);
  const hasAddress = addressParts.length > 0;

  // Get current stage info
  const currentStage = pipelinePatient?.pipeline_stages;
  
  // Determine if we should show Create Task button prominently
  const showCreateTask = recallStatus === 'overdue' || recallStatus === 'due_soon';

  const patientFullName = `${patient.first_name} ${patient.last_name}`;

  // Calculate engagement metrics
  const noShows = bookings.filter(b => b.status === 'no_show').length;
  const cancellations = bookings.filter(b => b.status === 'cancelled').length;
  const favoriteTreatment = Object.entries(treatmentGroups).sort((a, b) => b[1].length - a[1].length)[0]?.[0] || '-';
  
  // Calculate average days between visits
  const sortedCompleted = [...completedBookings].sort((a, b) => 
    parseISO(a.booking_date).getTime() - parseISO(b.booking_date).getTime()
  );
  let avgDaysBetweenVisits: number | null = null;
  if (sortedCompleted.length > 1) {
    let totalDays = 0;
    for (let i = 1; i < sortedCompleted.length; i++) {
      totalDays += differenceInDays(
        parseISO(sortedCompleted[i].booking_date),
        parseISO(sortedCompleted[i - 1].booking_date)
      );
    }
    avgDaysBetweenVisits = Math.round(totalDays / (sortedCompleted.length - 1));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/crm/patients')} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('patientDetail:backToPatients')}
      </Button>

      {/* Header Section with Quick Actions */}
      <div className="card-elevated p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-semibold text-accent-foreground">
              {patient.first_name.charAt(0)}
              {patient.last_name.charAt(0)}
            </span>
          </div>

          {/* Patient Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">
                {patient.last_name.toUpperCase()}, {patient.first_name}
              </h1>
              {recallStatus && <RecallStatusBadge status={recallStatus} />}
            </div>

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
              {patient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{patient.email}</span>
                </div>
              )}
              {patient.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.date_of_birth && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(parseISO(patient.date_of_birth), 'd MMM yyyy', { locale: dateLocale })}</span>
                </div>
              )}
            </div>

            {/* Address */}
            {hasAddress && (
              <div className="flex items-start gap-2 mt-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{addressParts.join(', ')}</span>
              </div>
            )}

            {/* Tags */}
            {patient.tags && patient.tags.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {patient.tags.map((tag, i) => (
                  <span 
                    key={i} 
                    className="px-2 py-0.5 text-xs rounded-full bg-accent text-accent-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Bar */}
        <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4">
          <QuickActionBar
            patientId={patient.id}
            patientName={patientFullName}
            email={patient.email}
            phone={patient.phone}
            onAddNote={() => setAddNoteOpen(true)}
            showCreateTask={showCreateTask}
          />
          
          {allStages.length > 0 && (
            <StageSelector
              patientId={patient.id}
              currentStage={currentStage || null}
              allStages={allStages}
            />
          )}
        </div>

        {/* Referral Banner */}
        {referral && (
          <div className="mt-4">
            <ReferralBanner
              referrerCode={referral.referrer_code}
              referrerName={referral.referrers?.[0]?.referrer_name}
              discountPercent={referral.discount_percent || undefined}
              expiresAt={referral.expires_at || undefined}
            />
          </div>
        )}
      </div>

      {/* Action Required / Follow-up Banner - Prominently placed */}
      {(recallStatus === 'overdue' || recallStatus === 'due_soon') && !nextAppointment && (() => {
        const hasRecentContact = recentCommunications && recentCommunications.length > 0;
        const lastContactDate = hasRecentContact ? new Date(recentCommunications[0].created_at) : null;
        const attemptCount = recentCommunications?.length || 0;

        // Overdue with recent contact → "En suivi" (blue/info)
        if (recallStatus === 'overdue' && hasRecentContact && lastContactDate) {
          return (
            <div className="card-elevated p-4 border-l-4 border-l-primary bg-primary/5">
              <h3 className="text-sm font-medium text-foreground mb-2">
                {t('patientDetail:followup.inProgress')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('patientDetail:followup.lastReminderSent', { time: formatTimeAgo(lastContactDate), count: attemptCount })}
                <br />
                {t('patientDetail:followup.noBookingYet')}
              </p>
            </div>
          );
        }

        // Overdue without recent contact → "Action requise" (red/destructive)
        if (recallStatus === 'overdue') {
          return (
            <div className="card-elevated p-4 border-l-4 border-l-destructive bg-destructive/5">
              <h3 className="text-sm font-medium text-foreground mb-2">
                {t('patientDetail:followup.actionRequired')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('patientDetail:followup.overdueNoAppointment')}
              </p>
            </div>
          );
        }

        // Due soon → "Recommandation" (orange/warning)
        return (
          <div className="card-elevated p-4 border-l-4 border-l-warning bg-warning/5">
            <h3 className="text-sm font-medium text-foreground mb-2">
              {t('patientDetail:followup.recommendation')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('patientDetail:followup.recallSoon')}
            </p>
          </div>
        );
      })()}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs Section */}
          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList>
              <TabsTrigger value="activity" className="flex items-center gap-1">
                <Activity className="h-3.5 w-3.5" />
                {t('patientDetail:tabs.activity')}
              </TabsTrigger>
              <TabsTrigger value="appointments">{t('patientDetail:tabs.appointments')}</TabsTrigger>
              <TabsTrigger value="communications" className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {t('patientDetail:tabs.communications')}
              </TabsTrigger>
              <TabsTrigger value="notes">{t('patientDetail:tabs.notes')} ({notes.length})</TabsTrigger>
              <TabsTrigger value="stats">{t('patientDetail:tabs.stats')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity" className="space-y-4">
              <UnifiedTimeline patientId={patient.id} />
            </TabsContent>

            <TabsContent value="appointments" className="space-y-4">
              {/* Treatment Timeline integrated here */}
              {Object.keys(treatmentGroups).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(treatmentGroups).map(([type, apts]) => (
                    <TreatmentTimeline
                      key={type}
                      treatmentType={type}
                      appointments={apts.map(a => ({
                        id: a.id,
                        date: a.booking_date,
                        service: a.service,
                        status: a.status,
                      }))}
                      recallIntervalDays={getRecallDays(type)}
                    />
                  ))}
                </div>
              )}

              {/* Appointment List */}
              {bookings.length > 0 ? (
                <div className="card-elevated divide-y divide-border">
                  {bookings.map((booking) => {
                    const statusColors = getStatusColors(booking.status);
                    const needsAction = isPastBookingUnprocessed(booking.status, booking.booking_date);
                    
                    return (
                      <div key={booking.id} className={`p-4 ${needsAction ? 'bg-warning/5' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-medium text-foreground">{booking.service}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(parseISO(booking.booking_date), 'd MMMM yyyy', { locale: dateLocale })}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors.bg} ${statusColors.text}`}>
                              {getStatusLabel(booking.status)}
                            </span>
                            {booking.booking_value > 0 && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {formatCurrency(booking.booking_value)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Status action buttons for past bookings that need attention */}
                        {needsAction && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 text-success border-success/20 hover:bg-success/10"
                              disabled={updatingBookingId === booking.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateBookingStatusMutation.mutate({ 
                                  bookingId: booking.id, 
                                  status: BOOKING_STATUS.COMPLETED 
                                });
                              }}
                            >
                              {updatingBookingId === booking.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 mr-1" />
                              )}
                              {t('patientDetail:appointments.completed')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/10"
                              disabled={updatingBookingId === booking.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateBookingStatusMutation.mutate({ 
                                  bookingId: booking.id, 
                                  status: BOOKING_STATUS.NO_SHOW 
                                });
                              }}
                            >
                              {updatingBookingId === booking.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <UserX className="h-4 w-4 mr-1" />
                              )}
                              {t('patientDetail:appointments.absent')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-muted-foreground"
                              disabled={updatingBookingId === booking.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateBookingStatusMutation.mutate({ 
                                  bookingId: booking.id, 
                                  status: BOOKING_STATUS.CANCELLED 
                                });
                              }}
                            >
                              {updatingBookingId === booking.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <X className="h-4 w-4 mr-1" />
                              )}
                              {t('patientDetail:appointments.cancelled')}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="card-elevated p-8 text-center text-muted-foreground">
                  {t('patientDetail:appointments.noAppointments')}
                </div>
              )}
            </TabsContent>

            <TabsContent value="communications" className="space-y-4">
              <CommunicationsHistory patientId={patient.id} />
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setAddNoteOpen(true)}>
                  {t('patientDetail:notes.addNote')}
                </Button>
              </div>
              
              {notes.length > 0 ? (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="card-elevated p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-foreground">{note.title}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {t(`patientDetail:notes.${note.note_type === 'medical' ? 'medical' : note.note_type === 'followup' ? 'followup' : 'general'}`)}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditNote(note)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={isDeletingNote === note.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        {format(parseISO(note.created_at), 'd MMM yyyy • HH:mm', { locale: dateLocale })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card-elevated p-8 text-center text-muted-foreground">
                  {t('patientDetail:notes.noNotes')}
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              {/* Financial Summary */}
              <div className="card-elevated p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t('patientDetail:stats.financialSummary')}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-foreground">{formatCurrency(lifetimeValue)}</div>
                    <div className="text-xs text-muted-foreground">{t('patientDetail:stats.totalValue')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {formatCurrency(completedBookings.length > 0 ? lifetimeValue / completedBookings.length : 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">{t('patientDetail:stats.averagePerVisit')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{bookings.length}</div>
                    <div className="text-xs text-muted-foreground">{t('patientDetail:stats.totalAppointments')}</div>
                  </div>
                </div>
              </div>

              {/* Engagement Summary */}
              <div className="card-elevated p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {t('patientDetail:stats.engagement')}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('patientDetail:stats.favoriteTreatment')}</span>
                    <span className="font-medium text-foreground">{favoriteTreatment}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('patientDetail:stats.noShows')}</span>
                    <span className={`font-medium ${noShows > 0 ? 'text-destructive' : 'text-foreground'}`}>
                      {noShows}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('patientDetail:stats.cancellations')}</span>
                    <span className={`font-medium ${cancellations > 0 ? 'text-warning' : 'text-foreground'}`}>
                      {cancellations}
                    </span>
                  </div>
                  {avgDaysBetweenVisits !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('patientDetail:stats.avgBetweenVisits')}</span>
                      <span className="font-medium text-foreground">{t('patientDetail:stats.days', { count: avgDaysBetweenVisits })}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Patient History */}
              <div className="card-elevated p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {t('patientDetail:stats.history')}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('patientDetail:stats.patientSince')}</span>
                    <span className="font-medium text-foreground">
                      {format(parseISO(patient.created_at), 'd MMM yyyy', { locale: dateLocale })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('patientDetail:stats.nextAppointment')}</span>
                    <span className="font-medium text-foreground">
                      {nextAppointment
                        ? format(parseISO(nextAppointment.booking_date), 'd MMM yyyy', { locale: dateLocale })
                        : t('patientDetail:stats.none')
                      }
                    </span>
                  </div>
                  {lastCompletedBooking && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('patientDetail:stats.lastVisit')}</span>
                      <span className="font-medium text-foreground">
                        {format(parseISO(lastCompletedBooking.booking_date), 'd MMM yyyy', { locale: dateLocale })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1">
          <PatientSidebar
            patientId={patient.id}
            referral={referral ? {
              referrerName: referral.referrers?.[0]?.referrer_name,
              discountPercent: referral.discount_percent || undefined,
            } : null}
          />
        </div>
      </div>

      {/* Add Note Dialog */}
      <Dialog open={addNoteOpen} onOpenChange={setAddNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('patientDetail:notes.addDialog')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('patientDetail:notes.noteTitle')}</Label>
              <Input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder={t('patientDetail:notes.noteTitlePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('patientDetail:notes.noteContent')}</Label>
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder={t('patientDetail:notes.noteContentPlaceholder')}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('patientDetail:notes.noteType')}</Label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{t('patientDetail:notes.general')}</SelectItem>
                  <SelectItem value="medical">{t('patientDetail:notes.medical')}</SelectItem>
                  <SelectItem value="followup">{t('patientDetail:notes.followup')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAddNote} 
              className="w-full"
              disabled={isSubmittingNote || !noteContent.trim()}
            >
              {isSubmittingNote ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('patientDetail:notes.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={editNoteOpen} onOpenChange={setEditNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('patientDetail:notes.editDialog')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('patientDetail:notes.noteTitle')}</Label>
              <Input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder={t('patientDetail:notes.noteTitlePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('patientDetail:notes.noteContent')}</Label>
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder={t('patientDetail:notes.noteContentPlaceholder')}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('patientDetail:notes.noteType')}</Label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{t('patientDetail:notes.general')}</SelectItem>
                  <SelectItem value="medical">{t('patientDetail:notes.medical')}</SelectItem>
                  <SelectItem value="followup">{t('patientDetail:notes.followup')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleEditNote} 
              className="w-full"
              disabled={isSubmittingNote || !noteContent.trim()}
            >
              {isSubmittingNote ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('patientDetail:notes.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
