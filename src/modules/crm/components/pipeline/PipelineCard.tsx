import { forwardRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { GripVertical, Calendar, Zap } from 'lucide-react';
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
}

interface PipelineCardProps {
  patient: PipelinePatient;
  hasActiveWorkflow?: boolean;
}

// Helper to handle both numeric and string priority values
function getPriorityInfo(priority: string | number | null): { label: string; className: string } | null {
  if (priority === 'high' || priority === 3) {
    return { label: 'Haute', className: 'bg-destructive/20 text-destructive' };
  }
  if (priority === 'medium' || priority === 2) {
    return { label: 'Moyenne', className: 'bg-warning/20 text-warning-foreground' };
  }
  if (priority === 'low' || priority === 1) {
    return { label: 'Basse', className: 'bg-muted text-muted-foreground' };
  }
  return null;
}

export const PipelineCard = forwardRef<HTMLDivElement, PipelineCardProps>(
  function PipelineCard({ patient, hasActiveWorkflow = false }, _ref) {
    const navigate = useNavigate();
    
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: patient.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const daysInStage = Math.floor(
      (Date.now() - new Date(patient.entered_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    const handleClick = () => {
      if (patient.patient_id) {
        navigate(`/crm/patients/${patient.patient_id}`);
      }
    };

    const priorityInfo = getPriorityInfo(patient.priority);

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'bg-card border border-border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all',
          isDragging && 'opacity-50 shadow-lg ring-2 ring-primary'
        )}
      >
        <div className="flex items-start gap-3">
          <button
            className="mt-1 p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          
          <div className="flex-1 min-w-0" onClick={handleClick}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-accent-foreground">
                  {patient.patients?.first_name?.charAt(0)}
                  {patient.patients?.last_name?.charAt(0)}
                </span>
              </div>
                <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">
                  {patient.patients?.first_name} {patient.patients?.last_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {patient.patients?.email || 'Pas d\'email'}
                </p>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {hasActiveWorkflow && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                  <Zap className="h-3 w-3" />
                  En séquence
                </span>
              )}
              {priorityInfo && (
                <span className={cn('text-xs px-2 py-0.5 rounded-full', priorityInfo.className)}>
                  {priorityInfo.label}
                </span>
              )}
            </div>

            {patient.notes && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                {patient.notes}
              </p>
            )}

            <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {daysInStage === 0 
                  ? "Aujourd'hui" 
                  : daysInStage === 1 
                    ? 'Hier' 
                    : `Il y a ${daysInStage} jours`}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
