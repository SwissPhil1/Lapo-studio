import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/shared/lib/supabase';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface Stage {
  id: string;
  name: string;
  color: string;
  order_index: number;
}

interface StageSelectorProps {
  patientId: string;
  currentStage: Stage | null;
  allStages: Stage[];
  onStageChange?: () => void;
}

export function StageSelector({
  patientId,
  currentStage,
  allStages,
  onStageChange
}: StageSelectorProps) {
  const { t } = useTranslation(['patientDetail']);
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const handleStageChange = async (newStage: Stage) => {
    if (newStage.id === currentStage?.id) return;

    setIsUpdating(true);
    try {
      if (currentStage) {
        const { error } = await supabase
          .from('pipeline_patients')
          .update({
            stage_id: newStage.id,
            entered_at: new Date().toISOString(),
          })
          .eq('patient_id', patientId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pipeline_patients')
          .insert({
            patient_id: patientId,
            stage_id: newStage.id,
            entered_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      toast.success(t('patientDetail:stage.movedTo', { name: newStage.name }));
      queryClient.invalidateQueries({ queryKey: ['patient-detail', patientId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      onStageChange?.();
    } catch (error: any) {
      toast.error(t('patientDetail:stage.error', { message: error.message }));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isUpdating}
          className="gap-2"
        >
          {currentStage ? (
            <>
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: currentStage.color }}
              />
              <span>{currentStage.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{t('patientDetail:stage.addToPipeline')}</span>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {allStages.map((stage) => (
          <DropdownMenuItem
            key={stage.id}
            onClick={() => handleStageChange(stage)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <span>{stage.name}</span>
            </div>
            {currentStage?.id === stage.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
