import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Mail, Phone, Calendar, Loader2, MapPin, Check, X, UserX, Pencil, Trash2, MoreHorizontal, Gift, MessageSquare, Activity } from 'lucide-react';
import { UnifiedTimeline } from '@/modules/crm/components/patients/UnifiedTimeline';
import { formatCurrency } from '@/shared/lib/constants';
import { format, parseISO, differenceInDays, formatDistanceToNow } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { TreatmentTimeline } from '@/modules/crm/components/patients/TreatmentTimeline';
import { RecallStatusBadge } from '@/modules/crm/components/patients/RecallStatusBadge';
import { QuickActionBar } from '@/modules/crm/components/patients/QuickActionBar';
import { StageSelector } from '@/modules/crm/components/patients/StageSelector';
import { CommunicationsHistory } from '@/modules/crm/components/patients/CommunicationsHistory';
import { ActiveTasksWidget } from '@/modules/crm/components/patients/ActiveTasksWidget';
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

      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (patientError) throw patientError;

      const { data: referralData } = await supabase
        .from('referrals')
        .select('referrer_code, discount_percent, expires_at, referrers(referrer_name)')
        .eq('referred_patient_id', id)
        .maybeSingle();

      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('id, booking_date, service, status, booking_value')
        .eq('patient_id', id)
        .order('booking_date', { ascending: false });

      const { data: notesData } = await supabase
        .from('crm_notes')
        .select('id, title, content, note_type, priority, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      const { data: protocolsData } = await supabase
        .from('treatment_protocols')
        .select('treatment_type, recall_interval_days');

      const { data: serviceMappingsData } = await supabase
        .from('service_mappings')
        .select('service_name, treatment_protocol_id, treatment_protocols(treatment_type, recall_interval_days)');

      const { data: pipelinePatientData } = await supabase
        .from('pipeline_patients')
        .select('stage_id, entered_at, pipeline_stages(id, name, color, order_index)')
        .eq('patient_id', id)
        .maybeSingle();

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

  const formatTimeAgo = (date: Date): string => {
    return formatDistanceToNow(date, { addSuffix: true, locale: dateLocale });
  };

  const handleAddNote = async () => {
    if (!noteContent.trim() || !id) return;
    setIsSubmittingNote(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('crm_notes').insert({
        user_id: id, title: noteTitle.trim() || 'Note', content: noteContent.trim(),
        note_type: noteType, priority: 'normal', created_by: user?.id || null,
      });
      if (error) throw error;
      toast({ title: t('patientDetail:notes.noteAdded') });
      setAddNoteOpen(false); setNoteTitle(''); setNoteContent(''); setNoteType('general');
      queryClient.invalidateQueries({ queryKey: ['patient-detail', id] });
    } catch (error: any) {
      toast({ title: t('patientDetail:toast.error'), description: error.message, variant: 'destructive' });
    } finally { setIsSubmittingNote(false); }
  };

  const handleEditNote = async () => {
    if (!noteContent.trim() || !editingNote) return;
    setIsSubmittingNote(true);
    try {
      const { error } = await supabase.from('crm_notes').update({
        title: noteTitle.trim() || 'Note', content: noteContent.trim(), note_type: noteType,
      }).eq('id', editingNote.id);
      if (error) throw error;
      toast({ title: t('patientDetail:notes.noteEdited') });
      setEditNoteOpen(false); setEditingNote(null); setNoteTitle(''); setNoteContent(''); setNoteType('general');
      queryClient.invalidateQueries({ queryKey: ['patient-detail', id] });
    } catch (error: any) {
      toast({ title: t('patientDetail:toast.error'), description: error.message, variant: 'destructive' });
    } finally { setIsSubmittingNote(false); }
  };

  const handleDeleteNote = async (noteId: string) => {
    setIsDeletingNote(noteId);
    try {
      const { error } = await supabase.from('crm_notes').delete().eq('id', noteId);
      if (error) throw error;
      toast({ title: t('patientDetail:notes.noteDeleted') });
      queryClient.invalidateQueries({ queryKey: ['patient-detail', id] });
    } catch (error: any) {
      toast({ title: t('patientDetail:toast.error'), description: error.message, variant: 'destructive' });
    } finally { setIsDeletingNote(null); }
  };

  const openEditNote = (note: CRMNote) => {
    setEditingNote(note); setNoteTitle(note.title); setNoteContent(note.content); setNoteType(note.note_type); setEditNoteOpen(true);
  };

  if (isLoading) {
    return (<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>);
  }

  if (error || !data) {
    return (
      <div className="card-elevated p-8 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">{t('patientDetail:notFound')}</h3>
        <p className="text-muted-foreground mb-4">{t('patientDetail:notFoundDesc')}</p>
        <Button variant="outline" onClick={() => navigate('/crm/patients')}>
          <ArrowLeft className="h-4 w-4 mr-2" />{t('patientDetail:backToPatients')}
        </Button>
      </div>
    );
  }

  const { patient, referral, bookings, notes, protocols, serviceMappings, pipelinePatient, allStages } = data;

  const completedBookings = bookings.filter(b => b.status === 'completed');
  const lifetimeValue = completedBookings.reduce((sum, b) => sum + b.booking_value, 0);
  const today = new Date();
  const upcomingBookings = bookings.filter(b => parseISO(b.booking_date) > today && b.status !== 'cancelled');
  const nextAppointment = upcomingBookings.length > 0
    ? upcomingBookings.sort((a, b) => parseISO(a.booking_date).getTime() - parseISO(b.booking_date).getTime())[0]
    : null;

  const treatmentGroups = bookings.reduce((acc, booking) => {
    const type = booking.service || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  const getRecallDays = (treatmentType: string) => getRecallDaysForService(treatmentType, serviceMappings, protocols);

  const completedWithService = completedBookings.map(b => ({ booking_date: b.booking_date, service: b.service }));
  const recallStatus = getOverallRecallStatusWithMappings(completedWithService, upcomingBookings, serviceMappings, protocols);

  const addressParts = [patient.address_line_1, patient.address_line_2, [patient.postal_code, patient.city].filter(Boolean).join(' '), patient.country].filter(Boolean);
  const hasAddress = addressParts.length > 0;
  const currentStage = pipelinePatient?.pipeline_stages;
  const showCreateTask = recallStatus === 'overdue' || recallStatus === 'due_soon';
  const patientFullName = `${patient.first_name} ${patient.last_name}`;

  const sortedCompleted = [...completedBookings].sort((a, b) => parseISO(a.booking_date).getTime() - parseISO(b.booking_date).getTime());
  let avgDaysBetweenVisits: number | null = null;
  if (sortedCompleted.length > 1) {
    let totalDays = 0;
    for (let i = 1; i < sortedCompleted.length; i++) {
      totalDays += differenceInDays(parseISO(sortedCompleted[i].booking_date), parseISO(sortedCompleted[i - 1].booking_date));
    }
    avgDaysBetweenVisits = Math.round(totalDays / (sortedCompleted.length - 1));
  }

  // ─── Redesigned render ───────────────────────────────────────────

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl mx-auto p-4 md:p-8">
      {/* Navigation + Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/crm/patients')} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          {t('patientDetail:backToPatients')}
        </Button>
        <div className="flex items-center gap-2">
          {allStages.length > 0 && (
            <StageSelector patientId={patient.id} currentStage={currentStage || null} allStages={allStages} />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setAddNoteOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />{t('patientDetail:notes.addNote')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />{t('common:delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Patient identity — compact */}
      <div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-accent-foreground">
              {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">
                {patient.first_name} {patient.last_name}
              </h1>
              {recallStatus && <RecallStatusBadge status={recallStatus} />}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
              {patient.email && (<span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{patient.email}</span>)}
              {patient.phone && (<span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{patient.phone}</span>)}
              {patient.date_of_birth && (<span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{format(parseISO(patient.date_of_birth), 'd MMM yyyy', { locale: dateLocale })}</span>)}
              {hasAddress && (<span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{addressParts.join(', ')}</span>)}
            </div>
          </div>
        </div>

        {/* Tags + Referral inline */}
        {((patient.tags && patient.tags.length > 0) || referral) && (
          <div className="flex items-center gap-2 mt-2.5 flex-wrap ml-[52px]">
            {patient.tags?.map((tag, i) => (
              <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-accent text-accent-foreground">{tag}</span>
            ))}
            {referral && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                <Gift className="h-3 w-3" />
                {referral.referrers?.[0]?.referrer_name || referral.referrer_code}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quick Action Bar — kept as component, renders compact */}
      <QuickActionBar
        patientId={patient.id}
        patientName={patientFullName}
        email={patient.email}
        phone={patient.phone}
        onAddNote={() => setAddNoteOpen(true)}
        showCreateTask={showCreateTask}
      />

      {/* KPI pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <div className="text-lg font-bold text-foreground">{formatCurrency(lifetimeValue)}</div>
          <div className="text-xs text-muted-foreground">{t('patientDetail:stats.totalValue')}</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-lg font-bold text-foreground">{completedBookings.length}</div>
          <div className="text-xs text-muted-foreground">{t('patientDetail:stats.totalAppointments')}</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-lg font-bold text-foreground">
            {nextAppointment ? format(parseISO(nextAppointment.booking_date), 'd MMM', { locale: dateLocale }) : '—'}
          </div>
          <div className="text-xs text-muted-foreground">{t('patientDetail:stats.nextAppointment')}</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-lg font-bold text-foreground">{avgDaysBetweenVisits !== null ? `${avgDaysBetweenVisits}d` : '—'}</div>
          <div className="text-xs text-muted-foreground">{t('patientDetail:stats.avgBetweenVisits')}</div>
        </Card>
      </div>

      {/* Contextual alert — single, compact */}
      {(recallStatus === 'overdue' || recallStatus === 'due_soon') && !nextAppointment && (() => {
        const hasRecentContact = recentCommunications && recentCommunications.length > 0;
        const lastContactDate = hasRecentContact ? new Date(recentCommunications[0].created_at) : null;
        const attemptCount = recentCommunications?.length || 0;

        if (recallStatus === 'overdue' && hasRecentContact && lastContactDate) {
          return (
            <div className="rounded-md px-4 py-3 border-l-4 border-l-primary bg-primary/5 text-sm">
              <span className="font-medium text-foreground">{t('patientDetail:followup.inProgress')}</span>
              <span className="text-muted-foreground ml-2">{t('patientDetail:followup.lastReminderSent', { time: formatTimeAgo(lastContactDate), count: attemptCount })}</span>
            </div>
          );
        }
        if (recallStatus === 'overdue') {
          return (
            <div className="rounded-md px-4 py-3 border-l-4 border-l-destructive bg-destructive/5 text-sm">
              <span className="font-medium text-foreground">{t('patientDetail:followup.actionRequired')}</span>
              <span className="text-muted-foreground ml-2">{t('patientDetail:followup.overdueNoAppointment')}</span>
            </div>
          );
        }
        return (
          <div className="rounded-md px-4 py-3 border-l-4 border-l-warning bg-warning/5 text-sm">
            <span className="font-medium text-foreground">{t('patientDetail:followup.recommendation')}</span>
            <span className="text-muted-foreground ml-2">{t('patientDetail:followup.recallSoon')}</span>
          </div>
        );
      })()}

      {/* Active tasks — inline, no sidebar */}
      <ActiveTasksWidget patientId={patient.id} />

      {/* Tabs — full width, single column */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity" className="flex items-center gap-1">
            <Activity className="h-3.5 w-3.5" />{t('patientDetail:tabs.activity')}
          </TabsTrigger>
          <TabsTrigger value="appointments">{t('patientDetail:tabs.appointments')}</TabsTrigger>
          <TabsTrigger value="communications" className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />{t('patientDetail:tabs.communications')}
          </TabsTrigger>
          <TabsTrigger value="notes">{t('patientDetail:tabs.notes')} ({notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <UnifiedTimeline patientId={patient.id} />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          {Object.keys(treatmentGroups).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(treatmentGroups).map(([type, apts]) => (
                <TreatmentTimeline key={type} treatmentType={type}
                  appointments={apts.map(a => ({ id: a.id, date: a.booking_date, service: a.service, status: a.status }))}
                  recallIntervalDays={getRecallDays(type)} />
              ))}
            </div>
          )}

          {bookings.length > 0 ? (
            <div className="card-elevated divide-y divide-border">
              {bookings.map((booking) => {
                const statusColors = getStatusColors(booking.status);
                const needsAction = isPastBookingUnprocessed(booking.status, booking.booking_date);
                return (
                  <div key={booking.id} className={`p-4 ${needsAction ? 'bg-warning/5' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">{booking.service}</div>
                        <div className="text-sm text-muted-foreground">{format(parseISO(booking.booking_date), 'd MMMM yyyy', { locale: dateLocale })}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors.bg} ${statusColors.text}`}>{getStatusLabel(booking.status)}</span>
                        {booking.booking_value > 0 && <span className="text-sm text-muted-foreground">{formatCurrency(booking.booking_value)}</span>}
                      </div>
                    </div>
                    {needsAction && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                        <Button size="sm" variant="outline" className="flex-1 text-success border-success/20 hover:bg-success/10" disabled={updatingBookingId === booking.id}
                          onClick={(e) => { e.stopPropagation(); updateBookingStatusMutation.mutate({ bookingId: booking.id, status: BOOKING_STATUS.COMPLETED }); }}>
                          {updatingBookingId === booking.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}{t('patientDetail:appointments.completed')}
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/10" disabled={updatingBookingId === booking.id}
                          onClick={(e) => { e.stopPropagation(); updateBookingStatusMutation.mutate({ bookingId: booking.id, status: BOOKING_STATUS.NO_SHOW }); }}>
                          {updatingBookingId === booking.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <UserX className="h-4 w-4 mr-1" />}{t('patientDetail:appointments.absent')}
                        </Button>
                        <Button size="sm" variant="outline" className="text-muted-foreground" disabled={updatingBookingId === booking.id}
                          onClick={(e) => { e.stopPropagation(); updateBookingStatusMutation.mutate({ bookingId: booking.id, status: BOOKING_STATUS.CANCELLED }); }}>
                          {updatingBookingId === booking.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <X className="h-4 w-4 mr-1" />}{t('patientDetail:appointments.cancelled')}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card-elevated p-8 text-center text-muted-foreground">{t('patientDetail:appointments.noAppointments')}</div>
          )}
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          <CommunicationsHistory patientId={patient.id} />
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setAddNoteOpen(true)}>{t('patientDetail:notes.addNote')}</Button>
          </div>
          {notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="group card-elevated p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground text-sm">{note.title}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {t(`patientDetail:notes.${note.note_type === 'medical' ? 'medical' : note.note_type === 'followup' ? 'followup' : 'general'}`)}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditNote(note)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteNote(note.id)} disabled={isDeletingNote === note.id}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                  <div className="text-xs text-muted-foreground mt-2">{format(parseISO(note.created_at), 'd MMM yyyy • HH:mm', { locale: dateLocale })}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-elevated p-8 text-center text-muted-foreground">{t('patientDetail:notes.noNotes')}</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Note Dialog */}
      <Dialog open={addNoteOpen} onOpenChange={setAddNoteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('patientDetail:notes.addDialog')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('patientDetail:notes.noteTitle')}</Label>
                <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder={t('patientDetail:notes.noteTitlePlaceholder')} />
              </div>
              <div className="space-y-2">
                <Label>{t('patientDetail:notes.noteType')}</Label>
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">{t('patientDetail:notes.general')}</SelectItem>
                    <SelectItem value="medical">{t('patientDetail:notes.medical')}</SelectItem>
                    <SelectItem value="followup">{t('patientDetail:notes.followup')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('patientDetail:notes.noteContent')}</Label>
              <Textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder={t('patientDetail:notes.noteContentPlaceholder')} rows={4} />
            </div>
            <Button onClick={handleAddNote} className="w-full" disabled={isSubmittingNote || !noteContent.trim()}>
              {isSubmittingNote ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}{t('patientDetail:notes.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={editNoteOpen} onOpenChange={setEditNoteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('patientDetail:notes.editDialog')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('patientDetail:notes.noteTitle')}</Label>
                <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder={t('patientDetail:notes.noteTitlePlaceholder')} />
              </div>
              <div className="space-y-2">
                <Label>{t('patientDetail:notes.noteType')}</Label>
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">{t('patientDetail:notes.general')}</SelectItem>
                    <SelectItem value="medical">{t('patientDetail:notes.medical')}</SelectItem>
                    <SelectItem value="followup">{t('patientDetail:notes.followup')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('patientDetail:notes.noteContent')}</Label>
              <Textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder={t('patientDetail:notes.noteContentPlaceholder')} rows={4} />
            </div>
            <Button onClick={handleEditNote} className="w-full" disabled={isSubmittingNote || !noteContent.trim()}>
              {isSubmittingNote ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}{t('patientDetail:notes.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
