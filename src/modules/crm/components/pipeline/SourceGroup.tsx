import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Link2, UserCircle } from 'lucide-react';
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

interface SourceGroupProps {
  source: 'referral' | 'organic';
  patients: PipelinePatient[];
  stageId: string;
}

const sourceConfig = {
  referral: {
    label: 'Referrals',
    icon: Link2,
    className: 'text-primary',
    bgClassName: 'bg-primary/10',
  },
  organic: {
    label: 'Organic',
    icon: UserCircle,
    className: 'text-muted-foreground',
    bgClassName: 'bg-muted',
  },
};

export function SourceGroup({ source, patients, stageId }: SourceGroupProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const config = sourceConfig[source];
  const Icon = config.icon;

  const { setNodeRef, isOver } = useDroppable({
    id: `${stageId}-${source}`,
    data: { stageId, source },
  });

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? t('common.accessibility.collapseGroup', { group: config.label }) : t('common.accessibility.expandGroup', { group: config.label })}
        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
        <Icon className={cn('h-4 w-4', config.className)} aria-hidden="true" />
        <span className="text-sm font-medium text-foreground">{config.label}</span>
        <span className={cn('ml-auto text-xs px-2 py-0.5 rounded-full', config.bgClassName, config.className)} aria-hidden="true">
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
                <PipelineCard key={pp.id} patient={pp} />
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
