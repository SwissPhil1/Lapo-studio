import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useToast } from '@/shared/hooks/use-toast';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Loader2, Filter, HelpCircle, Sparkles } from 'lucide-react';
import { PatientTableRow } from '@/modules/crm/components/patients/PatientTableRow';
import { AISearchInput } from '@/modules/crm/components/patients/AISearchInput';
import { BulkActionBar } from '@/modules/crm/components/patients/BulkActionBar';
import { BulkEmailDialog } from '@/modules/crm/components/patients/BulkEmailDialog';
import { SaveSegmentDialog } from '@/modules/crm/components/patients/SaveSegmentDialog';
import { CreateCampaignDialog } from '@/modules/crm/components/patients/CreateCampaignDialog';
import { SavedSegmentsList } from '@/modules/crm/components/patients/SavedSegmentsList';
import { getOverallRecallStatusWithMappings, getRecallContext, type ServiceMapping, type TreatmentProtocol, type FollowupContext } from '@/shared/lib/recallUtils';
import { isBookingForRecall, isPastBookingUnprocessed, BOOKING_STATUS } from '@/shared/lib/bookingStatus';


type PatientFilter = 'all' | 'to_contact' | 'in_followup' | 'scheduled' | 'new_leads' | 'overdue';

const FILTER_KEYS: PatientFilter[] = ['all', 'to_contact', 'in_followup', 'scheduled', 'new_leads', 'overdue'];

const PATIENTS_PER_PAGE = 50;

interface ActiveTask {
  id: string;
  task_type: string;
  due_date: string | null;
  status: string;
  snoozed_until: string | null;
}

interface PipelineStage {
  name: string;
  color: string | null;
}

interface PatientWithDetails {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  tags: string[] | null;
  created_at: string;
  referral?: {
    referrer_code: string;
    referrer_name?: string;
  } | null;
  pastBookings: { booking_date: string; status: string; service?: string; booking_value?: number }[];
  upcomingBookings: { booking_date: string }[];
  hasUnprocessedBooking: boolean;
  hasNoShow: boolean;
  activeTask: ActiveTask | null;
  pipelineStage: PipelineStage | null;
  totalValue: number;
  followupContext: FollowupContext;
  hasRecentCommunication: boolean;
}

interface PatientsQueryResult {
  patients: PatientWithDetails[];
  totalCount: number;
  serviceMappings: ServiceMapping[];
  treatmentProtocols: TreatmentProtocol[];
}

interface Segment {
  id: string;
  name: string;
  type: string;
  ai_query: string | null;
  patient_ids: string[] | null;
  created_at: string;
}

export default function Patients() {
  const { t } = useTranslation(['patients', 'common']);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PatientFilter>('all');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    is_business_contact: false,
  });
  
  // AI Search state
  const [isAISearchMode, setIsAISearchMode] = useState(false);
  const [aiSearchResults, setAISearchResults] = useState<string[] | null>(null);
  const [aiExplanation, setAIExplanation] = useState('');
  const [isAISearching, setIsAISearching] = useState(false);
  const [aiResultCount, setAIResultCount] = useState<number | null>(null);
  const [currentAIQuery, setCurrentAIQuery] = useState<string>('');
  
  // Static segment filter (for patientIds URL param)
  const [staticPatientIds, setStaticPatientIds] = useState<string[] | null>(null);
  
  // Bulk selection state
  const [selectedPatientIds, setSelectedPatientIds] = useState<Set<string>>(new Set());
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
  const [isSaveSegmentOpen, setIsSaveSegmentOpen] = useState(false);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  
  // Segment for campaign creation
  const [segmentForCampaign, setSegmentForCampaign] = useState<Segment | null>(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Track if we've processed URL params
  const hasProcessedUrlParams = useRef(false);
  
  // Debounce search input
  const debouncedSearch = useDebounce(search, 300);

  // Sync filter, page, and AI query from URL params on mount
  useEffect(() => {
    if (hasProcessedUrlParams.current) return;
    
    const urlFilter = searchParams.get('filter');
    const urlPage = searchParams.get('page');
    const urlAiQuery = searchParams.get('aiQuery');
    const urlPatientIds = searchParams.get('patientIds');
    
    if (urlFilter && FILTER_KEYS.includes(urlFilter as PatientFilter)) {
      setFilter(urlFilter as PatientFilter);
    }
    if (urlPage) {
      const pageNum = parseInt(urlPage, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        setPage(pageNum);
      }
    }
    
    // Handle AI query from URL (dynamic segment)
    if (urlAiQuery) {
      setIsAISearchMode(true);
      setCurrentAIQuery(urlAiQuery);
      hasProcessedUrlParams.current = true;
      // Trigger AI search
      handleAISearch(urlAiQuery);
    }
    // Handle static patient IDs from URL (static segment)
    else if (urlPatientIds) {
      const ids = urlPatientIds.split(',').filter(id => id.trim());
      if (ids.length > 0) {
        setStaticPatientIds(ids);
        hasProcessedUrlParams.current = true;
      }
    } else {
      hasProcessedUrlParams.current = true;
    }
  }, [searchParams]);

  // Update URL when filter or page changes
  const updateUrlParams = (newFilter: PatientFilter, newPage: number) => {
    const params = new URLSearchParams();
    if (newFilter !== 'all') {
      params.set('filter', newFilter);
    }
    if (newPage > 1) {
      params.set('page', newPage.toString());
    }
    setSearchParams(params);
  };

  const handleFilterChange = (newFilter: PatientFilter) => {
    setFilter(newFilter);
    setPage(1);
    updateUrlParams(newFilter, 1);
    // Clear AI search when changing filters
    if (aiSearchResults) {
      clearAISearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrlParams(filter, newPage);
  };

  // AI Search handler
  const handleAISearch = async (query: string) => {
    setIsAISearching(true);
    setCurrentAIQuery(query);
    try {
      const { data, error } = await supabase.functions.invoke('ai-patient-search', {
        body: { query }
      });
      
      if (error) {
        throw new Error(error.message || t('patients:aiSearchErrorGeneric'));
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setAISearchResults(data.patientIds || []);
      setAIExplanation(data.explanation || '');
      setAIResultCount(data.resultCount ?? data.patientIds?.length ?? 0);
      setPage(1);
      
      // Invalidate query to refetch with AI filter
      queryClient.invalidateQueries({ queryKey: ['patients-list'] });
      
    } catch (err) {
      console.error('AI Search error:', err);
      toast({
        title: t('patients:aiSearchError'),
        description: err instanceof Error ? err.message : t('patients:aiSearchErrorGeneric'),
        variant: "destructive"
      });
    } finally {
      setIsAISearching(false);
    }
  };

  const clearAISearch = () => {
    setAISearchResults(null);
    setAIExplanation('');
    setAIResultCount(null);
    setCurrentAIQuery('');
    setStaticPatientIds(null);
    // Clear URL params
    setSearchParams({});
    queryClient.invalidateQueries({ queryKey: ['patients-list'] });
  };

  const toggleAISearchMode = () => {
    const newMode = !isAISearchMode;
    setIsAISearchMode(newMode);
    if (!newMode) {
      clearAISearch();
    }
  };

  // Handle applying a saved segment
  const handleApplySegment = (segment: Segment) => {
    if (segment.type === 'dynamic' && segment.ai_query) {
      setIsAISearchMode(true);
      setCurrentAIQuery(segment.ai_query);
      handleAISearch(segment.ai_query);
    } else if (segment.patient_ids && segment.patient_ids.length > 0) {
      setStaticPatientIds(segment.patient_ids);
      setIsAISearchMode(false);
      queryClient.invalidateQueries({ queryKey: ['patients-list'] });
    }
  };

  // Handle creating campaign from segment
  const handleCreateCampaignFromSegment = (segment: Segment) => {
    setSegmentForCampaign(segment);
    setIsCreateCampaignOpen(true);
  };

  const { data, isLoading, error } = useQuery<PatientsQueryResult>({
    queryKey: ['patients-list', debouncedSearch, filter, page, aiSearchResults, staticPatientIds],
    queryFn: async () => {
      // Session guard: ensure user is authenticated before querying
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('SESSION_EXPIRED');
      }

      // Fetch service mappings and protocols in parallel with initial data
      const [serviceMappingsResult, protocolsResult] = await Promise.all([
        supabase
          .from('service_mappings')
          .select('service_name, treatment_protocol_id, treatment_protocols(treatment_type, recall_interval_days)'),
        supabase
          .from('treatment_protocols')
          .select('treatment_type, recall_interval_days'),
      ]);

      const serviceMappings: ServiceMapping[] = (serviceMappingsResult.data || []) as ServiceMapping[];
      const treatmentProtocols: TreatmentProtocol[] = (protocolsResult.data || []) as TreatmentProtocol[];

      // Fetch patients with count
      let query = supabase
        .from('patients')
        .select('id, first_name, last_name, email, phone, date_of_birth, tags, created_at', { count: 'exact' })
        .order('last_name', { ascending: true });

      // If AI search is active, filter by those IDs
      if (aiSearchResults && aiSearchResults.length > 0) {
        query = query.in('id', aiSearchResults);
      } else if (aiSearchResults && aiSearchResults.length === 0) {
        // AI search returned no results
        return { patients: [], totalCount: 0, serviceMappings, treatmentProtocols };
      }
      // If static patient IDs filter is active (from segment)
      else if (staticPatientIds && staticPatientIds.length > 0) {
        query = query.in('id', staticPatientIds);
      }

      // Only apply text search if NOT using AI search results
      if (debouncedSearch && !aiSearchResults) {
        query = query.or(`first_name.ilike.%${debouncedSearch}%,last_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`);
      }

      const { data: patientsData, error: patientsError } = await query;
      if (patientsError) throw patientsError;

      if (!patientsData || patientsData.length === 0) {
        return { patients: [], totalCount: 0, serviceMappings, treatmentProtocols };
      }

      const patientIds = patientsData.map(p => p.id);

      // Calculate date for followup window (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString();

      // Fetch related data in parallel
      const [referralsResult, bookingsResult, tasksResult, pipelineResult, communicationsResult, snoozedTasksResult] = await Promise.all([
        supabase
          .from('referrals')
          .select('referred_patient_id, referrer_code, referrers(referrer_name)')
          .in('referred_patient_id', patientIds),
        supabase
          .from('bookings')
          .select('patient_id, booking_date, status, service, booking_value')
          .in('patient_id', patientIds)
          .eq('is_test', false),
        supabase
          .from('reactivation_tasks')
          .select('id, patient_id, task_type, due_date, status, snoozed_until')
          .in('patient_id', patientIds)
          .in('status', ['pending', 'in_progress']),
        supabase
          .from('pipeline_patients')
          .select('patient_id, pipeline_stages(name, color)')
          .in('patient_id', patientIds),
        // Fetch recent outbound communications (last 7 days) for followup context
        supabase
          .from('crm_communication_logs')
          .select('patient_id, sent_at')
          .in('patient_id', patientIds)
          .eq('direction', 'outbound')
          .gte('sent_at', sevenDaysAgoStr)
          .order('sent_at', { ascending: false }),
        // Fetch snoozed tasks for followup context
        supabase
          .from('reactivation_tasks')
          .select('patient_id, snoozed_until')
          .in('patient_id', patientIds)
          .not('snoozed_until', 'is', null)
          .gt('snoozed_until', new Date().toISOString()),
      ]);

      const referralsData = referralsResult.data;
      const bookingsData = bookingsResult.data;
      const tasksData = tasksResult.data;
      const pipelineData = pipelineResult.data;
      const communicationsData = communicationsResult.data;
      const snoozedTasksData = snoozedTasksResult.data;

      // Map data together
      const enrichedPatients: PatientWithDetails[] = patientsData.map(patient => {
        const referral = referralsData?.find(r => r.referred_patient_id === patient.id);
        const patientBookings = bookingsData?.filter(b => b.patient_id === patient.id) || [];
        
        const pastBookings = patientBookings
          .filter(b => isBookingForRecall(b.status || '', b.booking_date))
          .map(b => ({ booking_date: b.booking_date, status: b.status || '', service: b.service, booking_value: b.booking_value }))
          .sort((a, b) => b.booking_date.localeCompare(a.booking_date));
        
        const upcomingBookings = patientBookings
          .filter(b => {
            const bookingDate = new Date(b.booking_date);
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            return bookingDate >= todayStart && b.status === BOOKING_STATUS.SCHEDULED;
          })
          .sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());

        const hasUnprocessedBooking = patientBookings.some(b => 
          isPastBookingUnprocessed(b.status || '', b.booking_date)
        );

        const hasNoShow = patientBookings.some(b => b.status === BOOKING_STATUS.NO_SHOW);

        const patientTasks = tasksData?.filter(t => t.patient_id === patient.id) || [];
        const activeTask = patientTasks.length > 0 ? {
          id: patientTasks[0].id,
          task_type: patientTasks[0].task_type,
          due_date: patientTasks[0].due_date,
          status: patientTasks[0].status,
          snoozed_until: patientTasks[0].snoozed_until || null,
        } : null;

        const pipelinePatient = pipelineData?.find(p => p.patient_id === patient.id);
        const pipelineStage = pipelinePatient?.pipeline_stages ? {
          name: (pipelinePatient.pipeline_stages as any).name,
          color: (pipelinePatient.pipeline_stages as any).color,
        } : null;

        const totalValue = patientBookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.booking_value || 0), 0);

        // Build followup context for recall status calculation
        const lastCommunication = communicationsData?.find(c => c.patient_id === patient.id);
        const snoozedTask = snoozedTasksData?.find(t => t.patient_id === patient.id);
        const hasRecentCommunication = !!lastCommunication;
        const followupContext: FollowupContext = {
          lastCommunicationDate: lastCommunication?.sent_at ? new Date(lastCommunication.sent_at) : null,
          snoozedUntilDate: snoozedTask?.snoozed_until ? new Date(snoozedTask.snoozed_until) : null,
        };

        return {
          ...patient,
          referral: referral ? {
            referrer_code: referral.referrer_code,
            referrer_name: (referral.referrers as any)?.referrer_name,
          } : null,
          pastBookings,
          upcomingBookings,
          hasUnprocessedBooking,
          hasNoShow,
          activeTask,
          pipelineStage,
          totalValue,
          followupContext,
          hasRecentCommunication,
        };
      });

      // Apply filter (skip if AI search is active - AI already filtered)
      let filteredPatients = enrichedPatients;
      const now = new Date();
      
      if (!aiSearchResults) {
        if (filter === 'to_contact') {
          // Patients with active task not snoozed
          filteredPatients = enrichedPatients.filter(p => {
            if (!p.activeTask) return false;
            const isSnoozed = p.activeTask.snoozed_until && new Date(p.activeTask.snoozed_until) > now;
            return !isSnoozed;
          });
        } else if (filter === 'in_followup') {
          // Patients with snoozed task OR recent communication (< 7 days)
          filteredPatients = enrichedPatients.filter(p => {
            const hasSnoozedTask = p.activeTask?.snoozed_until && new Date(p.activeTask.snoozed_until) > now;
            return hasSnoozedTask || p.hasRecentCommunication;
          });
        } else if (filter === 'scheduled') {
          // Patients with upcoming scheduled appointments
          filteredPatients = enrichedPatients.filter(p => p.upcomingBookings.length > 0);
        } else if (filter === 'new_leads') {
          // Patients in "New Lead" pipeline stage without past bookings
          filteredPatients = enrichedPatients.filter(p => 
            p.pipelineStage?.name === 'New Lead' && p.pastBookings.length === 0
          );
        } else if (filter === 'overdue') {
          // Recall overdue AND no scheduled appointment AND not in active followup
          filteredPatients = enrichedPatients.filter(p => {
            if (p.upcomingBookings.length > 0) return false;
            if (p.hasRecentCommunication) return false;
            if (p.activeTask?.snoozed_until && new Date(p.activeTask.snoozed_until) > now) return false;
            
            const recallStatus = getOverallRecallStatusWithMappings(
              p.pastBookings, 
              p.upcomingBookings,
              serviceMappings,
              treatmentProtocols,
              p.followupContext
            );
            return recallStatus === 'overdue';
          });
        }
      }

      // Apply pagination
      const startIndex = (page - 1) * PATIENTS_PER_PAGE;
      const paginatedPatients = filteredPatients.slice(startIndex, startIndex + PATIENTS_PER_PAGE);

      return { 
        patients: paginatedPatients, 
        totalCount: filteredPatients.length,
        serviceMappings,
        treatmentProtocols,
      };
    },
  });

  const patients = data?.patients || [];
  const totalCount = data?.totalCount || 0;
  const serviceMappings = data?.serviceMappings || [];
  const treatmentProtocols = data?.treatmentProtocols || [];
  const totalPages = Math.ceil(totalCount / PATIENTS_PER_PAGE);

  const createMutation = useMutation({
    mutationFn: async (patient: typeof newPatient) => {
      const { error } = await supabase.from('patients').insert([{
        first_name: patient.first_name,
        last_name: patient.last_name,
        email: patient.email || null,
        phone: patient.phone_number || null,
        date_of_birth: patient.date_of_birth || null,
        is_business_contact: patient.is_business_contact,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients-list'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-patients'] });
      setIsDialogOpen(false);
      setNewPatient({ first_name: '', last_name: '', email: '', phone_number: '', date_of_birth: '', is_business_contact: false });
      toast({ title: t('patients:toast.added'), description: t('patients:toast.addedDesc') });
    },
    onError: (error: Error) => {
      toast({ title: t('patients:toast.error'), description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.first_name || !newPatient.last_name) {
      toast({ title: t('patients:toast.error'), description: t('patients:dialog.nameRequired'), variant: 'destructive' });
      return;
    }
    createMutation.mutate(newPatient);
  };

  const handleRowClick = (patientId: string) => {
    navigate(`/crm/patients/${patientId}`);
  };

  // Bulk selection handlers
  const handleSelectPatient = (patientId: string, checked: boolean) => {
    setSelectedPatientIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(patientId);
      } else {
        next.delete(patientId);
      }
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPatientIds(new Set(patients.map(p => p.id)));
    } else {
      setSelectedPatientIds(new Set());
    }
  };

  const handleClearSelection = () => {
    setSelectedPatientIds(new Set());
  };

  const handleBulkEmailSuccess = () => {
    setSelectedPatientIds(new Set());
  };

  const allSelected = patients.length > 0 && patients.every(p => selectedPatientIds.has(p.id));


  // Check if segment filter is active
  const isSegmentActive = !!staticPatientIds || !!aiSearchResults;

  // Handle session expired error
  if (error?.message === 'SESSION_EXPIRED') {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{t('patients:sessionExpired')}</h3>
          <p className="text-muted-foreground">{t('patients:sessionExpiredDesc')}</p>
        </div>
        <Button onClick={() => navigate('/auth')} variant="gradient">
          {t('patients:reconnect')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active segment indicator */}
      {isSegmentActive && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {staticPatientIds
              ? t('patients:staticSegment', { count: staticPatientIds.length })
              : t('patients:aiQueryLabel', { query: currentAIQuery })}
          </span>
          <Button variant="ghost" size="sm" onClick={clearAISearch} className="ml-auto h-7 text-xs">
            {t('patients:clearFilter')}
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('patients:search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              disabled={isAISearchMode}
            />
          </div>
          
          <Select 
            value={filter} 
            onValueChange={(v) => handleFilterChange(v as PatientFilter)}
            disabled={isAISearchMode}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('patients:filters.all')} />
            </SelectTrigger>
            <SelectContent>
              {FILTER_KEYS.map((key) => (
                <SelectItem key={key} value={key}>{t(`patients:filters.${key}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant={isAISearchMode ? "secondary" : "outline"}
            onClick={toggleAISearchMode}
            className={isAISearchMode ? "bg-accent text-accent-foreground border-primary/30" : ""}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {t('patients:aiSearch')}
          </Button>

          {/* Saved Segments - Popover button */}
          <SavedSegmentsList
            onApplySegment={handleApplySegment}
            onCreateCampaign={handleCreateCampaignFromSegment}
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient">
              <Plus className="h-4 w-4 mr-2" />
              {t('patients:addPatient')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('patients:dialog.title')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">{t('patients:dialog.firstName')}</Label>
                  <Input
                    id="first_name"
                    value={newPatient.first_name}
                    onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">{t('patients:dialog.lastName')}</Label>
                  <Input
                    id="last_name"
                    value={newPatient.last_name}
                    onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('patients:dialog.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('patients:dialog.phone')}</Label>
                <Input
                  id="phone"
                  value={newPatient.phone_number}
                  onChange={(e) => setNewPatient({ ...newPatient, phone_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">{t('patients:dialog.dob')}</Label>
                <Input
                  id="dob"
                  type="date"
                  value={newPatient.date_of_birth}
                  onChange={(e) => setNewPatient({ ...newPatient, date_of_birth: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_business_contact"
                  checked={newPatient.is_business_contact}
                  onCheckedChange={(checked) => setNewPatient({ ...newPatient, is_business_contact: checked === true })}
                />
                <Label htmlFor="is_business_contact" className="text-sm font-normal text-muted-foreground cursor-pointer">
                  {t('patients:dialog.businessContact')}
                </Label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('patients:dialog.cancel')}
                </Button>
                <Button type="submit" variant="gradient" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('patients:dialog.add')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* AI Search Panel */}
      {isAISearchMode && (
        <AISearchInput
          onSearch={handleAISearch}
          onClear={clearAISearch}
          isSearching={isAISearching}
          explanation={aiExplanation}
          resultCount={aiResultCount}
        />
      )}

      {/* Patients Table */}
      <TooltipProvider>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : patients.length > 0 ? (
          <div className="space-y-4">
            <div className="card-elevated overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label={t('patients:table.selectAll')}
                      />
                    </TableHead>
                    <TableHead className="w-[220px]">{t('patients:table.patient')}</TableHead>
                    <TableHead className="w-[80px]">{t('patients:table.signals')}</TableHead>
                    <TableHead className="w-[140px]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                            {t('patients:table.actionRequired')}
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-semibold">{t('patients:table.actionRequiredTitle')}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('patients:table.actionRequiredDesc')}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead>{t('patients:table.nextAppointment')}</TableHead>
                    <TableHead>{t('patients:table.recall')}</TableHead>
                    <TableHead className="text-right">{t('patients:table.value')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {patients.map((patient) => {
                    const recallStatus = getOverallRecallStatusWithMappings(
                      patient.pastBookings,
                      patient.upcomingBookings,
                      serviceMappings,
                      treatmentProtocols,
                      patient.followupContext
                    );
                    const recallContextData = getRecallContext(
                      patient.pastBookings,
                      serviceMappings,
                      treatmentProtocols
                    );
                    const daysOverdue = recallContextData.daysOverdue ?? undefined;
                    return (
                      <PatientTableRow
                        key={patient.id}
                        patient={patient}
                        recallStatus={recallStatus}
                        daysOverdue={daysOverdue}
                        recallContext={recallContextData}
                        onClick={handleRowClick}
                        isSelected={selectedPatientIds.has(patient.id)}
                        onSelectChange={handleSelectPatient}
                        showCheckbox={true}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {t('patients:pagination.showing', { from: ((page - 1) * PATIENTS_PER_PAGE) + 1, to: Math.min(page * PATIENTS_PER_PAGE, totalCount), total: totalCount })}
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => page > 1 && handlePageChange(page - 1)}
                        className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum)}
                            isActive={pageNum === page}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => page < totalPages && handlePageChange(page + 1)}
                        className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        ) : (
          <div className="card-elevated p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              {isAISearchMode ? (
                <Sparkles className="h-8 w-8 text-muted-foreground" />
              ) : (
                <Search className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {isAISearchMode && aiSearchResults !== null
                ? t('patients:empty.noMatch')
                : t('patients:empty.noPatients')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isAISearchMode && aiSearchResults !== null
                ? t('patients:empty.aiNoMatch')
                : search
                  ? t('patients:empty.searchNoMatch')
                  : t('patients:empty.firstPatient')}
            </p>
            {!search && !isAISearchMode && (
              <Button variant="gradient" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('patients:addPatient')}
              </Button>
            )}
          </div>
        )}
      </TooltipProvider>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedPatientIds.size}
        onSendEmail={() => setIsBulkEmailOpen(true)}
        onSaveSegment={() => setIsSaveSegmentOpen(true)}
        onCreateCampaign={() => setIsCreateCampaignOpen(true)}
        onClearSelection={handleClearSelection}
        hasAIQuery={!!currentAIQuery}
      />

      {/* Bulk Email Dialog */}
      <BulkEmailDialog
        open={isBulkEmailOpen}
        onOpenChange={setIsBulkEmailOpen}
        selectedPatientIds={Array.from(selectedPatientIds)}
        onSuccess={handleBulkEmailSuccess}
      />

      {/* Save Segment Dialog */}
      <SaveSegmentDialog
        open={isSaveSegmentOpen}
        onOpenChange={setIsSaveSegmentOpen}
        patientIds={Array.from(selectedPatientIds)}
        aiQuery={currentAIQuery || undefined}
        patientCount={selectedPatientIds.size}
        onSuccess={handleClearSelection}
      />

      {/* Create Campaign Dialog */}
      <CreateCampaignDialog
        open={isCreateCampaignOpen}
        onOpenChange={(open) => {
          setIsCreateCampaignOpen(open);
          if (!open) setSegmentForCampaign(null);
        }}
        patientIds={segmentForCampaign?.patient_ids || Array.from(selectedPatientIds)}
        aiQuery={segmentForCampaign?.ai_query || currentAIQuery || undefined}
        patientCount={segmentForCampaign?.patient_ids?.length || selectedPatientIds.size}
        onSuccess={() => {
          handleClearSelection();
          setSegmentForCampaign(null);
        }}
      />
    </div>
  );
}
