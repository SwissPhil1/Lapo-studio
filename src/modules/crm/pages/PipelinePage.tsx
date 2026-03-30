import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { Loader2, User } from 'lucide-react';
import { format } from 'date-fns';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PipelineCard } from '@/modules/crm/components/pipeline/PipelineCard';
import { AddToPipelineDialog } from '@/modules/crm/components/pipeline/AddToPipelineDialog';
import { usePipelineActions } from '@/shared/hooks/usePipelineActions';
import { PipelineMetrics } from '@/modules/crm/components/pipeline/PipelineMetrics';
import { SourceGroup } from '@/modules/crm/components/pipeline/SourceGroup';
import { FollowupGroup } from '@/modules/crm/components/pipeline/FollowupGroup';
import { cn } from '@/shared/lib/utils';

interface PipelineStage {
  id: string;
  name: string;
  order_index: number;
  color: string | null;
  is_active: boolean | null;
}

interface PipelinePatient {
  id: string;
  patient_id: string | null;
  stage_id: string | null;
  entered_at: string;
  notes: string | null;
  priority: string | number | null;
  patients?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  };
  referrals?: {
    id: string;
    origin_type: string | null;
  }[] | null;
}

// Droppable Stage Column Component
function StageColumn({ 
  stage, 
  children 
}: { 
  stage: PipelineStage; 
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-muted/50 rounded-xl p-3 min-h-[400px] space-y-3 transition-colors duration-200',
        isOver && 'bg-primary/10 ring-2 ring-primary/30'
      )}
    >
      {children}
    </div>
  );
}

export default function Pipeline() {
  const { t } = useTranslation(['pipeline', 'common']);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { movePatient } = usePipelineActions();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  const { data: stages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
      
      if (error) throw error;
      return (data || []) as PipelineStage[];
    },
  });

  const { data: pipelinePatients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ['pipeline-patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_patients')
        .select(`
          *,
          patients!inner (
            id,
            first_name,
            last_name,
            email
          )
        `);
      
      if (error) {
        console.error('Pipeline patients error:', error);
        return [];
      }

      // Fetch referrals for each patient to determine source
      const patientIds = data?.map(p => p.patient_id).filter(Boolean) || [];
      const { data: referrals } = await supabase
        .from('referrals')
        .select('id, referred_patient_id, origin_type')
        .in('referred_patient_id', patientIds);

      // Map referrals to patients
      const referralsByPatient = new Map<string, { id: string; origin_type: string | null }[]>();
      referrals?.forEach(r => {
        if (r.referred_patient_id) {
          const existing = referralsByPatient.get(r.referred_patient_id) || [];
          existing.push({ id: r.id, origin_type: r.origin_type });
          referralsByPatient.set(r.referred_patient_id, existing);
        }
      });

      return (data || []).map(p => ({
        ...p,
        referrals: p.patient_id ? referralsByPatient.get(p.patient_id) || null : null,
      })) as PipelinePatient[];
    },
  });

  // Fetch active workflow enrollments to determine which patients are "in sequence"
  const { data: activeEnrollmentIds = [] } = useQuery({
    queryKey: ['active-workflow-enrollments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_workflow_enrollments')
        .select('patient_id')
        .eq('status', 'active');
      
      if (error) {
        console.error('Workflow enrollments error:', error);
        return [];
      }
      return data?.map(e => e.patient_id).filter((id): id is string => id !== null) || [];
    },
  });

  // Fetch patients with pending follow-ups (future follow_up_date)
  const { data: pendingFollowupPatientIds = [] } = useQuery({
    queryKey: ['pending-followup-communications'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('crm_communication_logs')
        .select('patient_id')
        .eq('direction', 'outbound')
        .gte('follow_up_date', today);
      
      if (error) {
        console.error('Pending followups error:', error);
        return [];
      }
      // Return unique patient IDs
      const uniqueIds = [...new Set(data?.map(e => e.patient_id).filter((id): id is string => id !== null) || [])];
      return uniqueIds;
    },
  });

  const isLoading = stagesLoading || patientsLoading;

  const getPatientsByStage = (stageId: string) => {
    return pipelinePatients.filter((pp) => pp.stage_id === stageId && pp.patients);
  };

  // Metrics calculations
  const metrics = useMemo(() => {
    const validPatients = pipelinePatients.filter(pp => pp.patients);
    const totalPatients = validPatients.length;
    
    // Find New Lead stage
    const newLeadStage = stages.find(s => s.name === 'New Lead');
    const completedStage = stages.find(s => s.name === 'Completed');
    
    // Stale leads: patients in New Lead stage for > 7 days
    const staleLeadsCount = newLeadStage 
      ? validPatients.filter(pp => {
          if (pp.stage_id !== newLeadStage.id) return false;
          const daysInStage = Math.floor(
            (Date.now() - new Date(pp.entered_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysInStage > 7;
        }).length
      : 0;
    
    // Converted count (Completed + Needs Follow-up)
    const needsFollowupStage = stages?.find(s => s.name === 'Needs Follow-up');
    const convertedCount = validPatients.filter(pp => 
      pp.stage_id === completedStage?.id || pp.stage_id === needsFollowupStage?.id
    ).length;
    
    // Conversion rate (converted / total)
    const conversionRate = totalPatients > 0 
      ? Math.round((convertedCount / totalPatients) * 100) 
      : null;
    
    // Average days in completed stage (approximation - from entered_at)
    const completedPatients = completedStage 
      ? validPatients.filter(pp => pp.stage_id === completedStage.id) 
      : [];
    
    let avgDaysToComplete: number | null = null;
    if (completedPatients.length > 0) {
      const totalDays = completedPatients.reduce((sum, pp) => {
        const days = Math.floor(
          (Date.now() - new Date(pp.entered_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      avgDaysToComplete = Math.round(totalDays / completedPatients.length);
    }
    
    return { totalPatients, avgDaysToComplete, conversionRate, staleLeadsCount };
  }, [pipelinePatients, stages]);

  // Group New Lead patients by source
  const getNewLeadGroups = (stageId: string) => {
    const stagePatients = getPatientsByStage(stageId);
    const referralPatients = stagePatients.filter(p => p.referrals && p.referrals.length > 0);
    const organicPatients = stagePatients.filter(p => !p.referrals || p.referrals.length === 0);
    return { referralPatients, organicPatients };
  };

  // Group Needs Follow-up patients by workflow status OR pending follow-up
  const getNeedsFollowupGroups = (stageId: string) => {
    const stagePatients = getPatientsByStage(stageId);
    // Patient is "in sequence" if they have an active workflow OR a future follow-up date
    const inSequencePatients = stagePatients.filter(p => 
      p.patient_id && (
        activeEnrollmentIds.includes(p.patient_id) || 
        pendingFollowupPatientIds.includes(p.patient_id)
      )
    );
    const needsContactPatients = stagePatients.filter(p => 
      !p.patient_id || (
        !activeEnrollmentIds.includes(p.patient_id) && 
        !pendingFollowupPatientIds.includes(p.patient_id)
      )
    );
    return { inSequencePatients, needsContactPatients };
  };

  const activePatient = pipelinePatients.find((p) => p.id === activeId);

  const existingPatientIds = pipelinePatients
    .map((pp) => pp.patient_id)
    .filter((id): id is string => id !== null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activePatientId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a source group (e.g., "stageId-referral")
    if (overId.includes('-')) {
      const [targetStageId] = overId.split('-');
      const patient = pipelinePatients.find((p) => p.id === activePatientId);
      if (patient && patient.stage_id !== targetStageId) {
        movePatient.mutate({
          pipelinePatientId: activePatientId,
          newStageId: targetStageId,
        });
      }
      return;
    }

    // Check if dropped on a stage
    const targetStage = stages.find((s) => s.id === overId);
    if (targetStage) {
      const patient = pipelinePatients.find((p) => p.id === activePatientId);
      if (patient && patient.stage_id !== targetStage.id) {
        movePatient.mutate({
          pipelinePatientId: activePatientId,
          newStageId: targetStage.id,
        });
      }
      return;
    }

    // Check if dropped on another patient card (move to that stage)
    const targetPatient = pipelinePatients.find((p) => p.id === overId);
    if (targetPatient && targetPatient.stage_id) {
      const patient = pipelinePatients.find((p) => p.id === activePatientId);
      if (patient && patient.stage_id !== targetPatient.stage_id) {
        movePatient.mutate({
          pipelinePatientId: activePatientId,
          newStageId: targetPatient.stage_id,
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const newLeadStage = stages.find(s => s.name === 'New Lead');
  const needsFollowupStage = stages.find(s => s.name === 'Needs Follow-up');

  return (
    <div className="space-y-6">
      {/* Metrics Bar */}
      <PipelineMetrics
        totalPatients={metrics.totalPatients}
        avgDaysToComplete={metrics.avgDaysToComplete}
        conversionRate={metrics.conversionRate}
        staleLeadsCount={metrics.staleLeadsCount}
      />

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {t('pipeline:description')}
        </p>
        <AddToPipelineDialog stages={stages} existingPatientIds={existingPatientIds} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage, index) => {
            const isNewLeadStage = stage.id === newLeadStage?.id;
            const isNeedsFollowupStage = stage.id === needsFollowupStage?.id;
            const stagePatients = getPatientsByStage(stage.id);

            return (
              <div
                key={stage.id}
                className="flex-shrink-0 w-80 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Stage Header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: stage.color || '#6b7280' }}
                  />
                  <h3 className="font-semibold text-foreground">{stage.name}</h3>
                  <span className="ml-auto text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {stagePatients.length}
                  </span>
                </div>

                {/* Stage Column - Droppable */}
                <StageColumn stage={stage}>
                  {isNewLeadStage ? (
                    // New Lead stage with source sub-sections
                    (() => {
                      const { referralPatients, organicPatients } = getNewLeadGroups(stage.id);
                      return (
                        <div className="space-y-4">
                          <SourceGroup
                            source="referral"
                            patients={referralPatients}
                            stageId={stage.id}
                          />
                          <SourceGroup
                            source="organic"
                            patients={organicPatients}
                            stageId={stage.id}
                          />
                        </div>
                      );
                    })()
                  ) : isNeedsFollowupStage ? (
                    // Needs Follow-up stage with workflow status sub-sections
                    (() => {
                      const { inSequencePatients, needsContactPatients } = getNeedsFollowupGroups(stage.id);
                      return (
                        <div className="space-y-4">
                          <FollowupGroup
                            followupType="in_sequence"
                            patients={inSequencePatients}
                            stageId={stage.id}
                            activeEnrollmentIds={activeEnrollmentIds}
                          />
                          <FollowupGroup
                            followupType="needs_contact"
                            patients={needsContactPatients}
                            stageId={stage.id}
                            activeEnrollmentIds={activeEnrollmentIds}
                          />
                        </div>
                      );
                    })()
                  ) : (
                    // Regular stages
                    <SortableContext
                      items={stagePatients.map((p) => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {stagePatients.length > 0 ? (
                        stagePatients.map((pp) => (
                          <PipelineCard 
                            key={pp.id} 
                            patient={pp} 
                            hasActiveWorkflow={pp.patient_id ? activeEnrollmentIds.includes(pp.patient_id) : false}
                          />
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground border-2 border-dashed border-muted-foreground/20 rounded-lg">
                          <User className="h-8 w-8 mb-2 opacity-50" />
                          <p className="text-sm">{t('pipeline:noPatients')}</p>
                          <p className="text-xs mt-1">{t('pipeline:dragHere')}</p>
                        </div>
                      )}
                    </SortableContext>
                  )}
                </StageColumn>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activePatient ? (
            <div className="bg-card border border-primary rounded-lg p-4 shadow-lg opacity-90 w-80">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-sm font-medium text-accent-foreground">
                    {activePatient.patients?.first_name?.charAt(0)}
                    {activePatient.patients?.last_name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {activePatient.patients?.first_name} {activePatient.patients?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activePatient.patients?.email || t('pipeline:noEmail')}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
