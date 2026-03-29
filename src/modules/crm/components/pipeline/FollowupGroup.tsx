import { useState } from 'react';
import { ChevronDown, ChevronRight, Zap, Phone } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PipelineCard } from './PipelineCard';
import { cn } from '@/shared/lib/utils';

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

interface FollowupGroupProps {
  followupType: 'in_sequence' | 'needs_contact';
  patients: PipelinePatient[];
  stageId: string;
  activeEnrollmentIds?: string[];
}

const followupConfig = {
  in_sequence: {
    label: 'Rappel en cours',
    icon: Zap,
    className: 'text-primary',
    bgClassName: 'bg-primary/15',
  },
  needs_contact: {
    label: 'À contacter',
    icon: Phone,
    className: 'text-warning',
    bgClassName: 'bg-warning/15',
  },
};

export function FollowupGroup({ followupType, patients, stageId, activeEnrollmentIds = [] }: FollowupGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = followupConfig[followupType];
  const Icon = config.icon;

  const { setNodeRef, isOver } = useDroppable({
    id: `${stageId}-${followupType}`,
    data: { stageId, followupType },
  });

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <Icon className={cn('h-4 w-4', config.className)} />
        <span className="text-sm font-medium text-foreground">{config.label}</span>
        <span className={cn('ml-auto text-xs px-2 py-0.5 rounded-full', config.bgClassName, config.className)}>
          {patients.length}
        </span>
      </button>

      {isExpanded && (
        <div
          ref={setNodeRef}
          className={cn(
            'ml-4 pl-3 border-l-2 border-border/50 space-y-2 min-h-[60px] transition-colors duration-200 rounded-r-lg',
            isOver && 'border-l-primary bg-primary/5'
          )}
        >
          <SortableContext
            items={patients.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {patients.length > 0 ? (
              patients.map((pp) => (
                <PipelineCard 
                  key={pp.id} 
                  patient={pp} 
                  hasActiveWorkflow={pp.patient_id ? activeEnrollmentIds.includes(pp.patient_id) : false}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-12 text-muted-foreground text-xs">
                Aucun patient
              </div>
            )}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
