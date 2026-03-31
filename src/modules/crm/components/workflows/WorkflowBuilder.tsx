import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, X, Loader2, GitBranch } from 'lucide-react';
import { toast } from 'sonner';
import { TriggerConfigPanel } from './TriggerConfigPanel';
import { WorkflowStepCard, type WorkflowStep } from './WorkflowStepCard';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Workflow {
  id?: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  is_active: boolean;
}

interface WorkflowBuilderProps {
  workflow?: Workflow & { id: string };
  existingSteps?: WorkflowStep[];
  onClose: () => void;
}

function SortableStepCard({
  step,
  onChange,
  onDelete,
}: {
  step: WorkflowStep;
  onChange: (s: WorkflowStep) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: step.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <WorkflowStepCard
        step={step}
        onChange={onChange}
        onDelete={onDelete}
        dragHandleProps={listeners}
      />
    </div>
  );
}

let tempIdCounter = 0;

export function WorkflowBuilder({ workflow, existingSteps, onClose }: WorkflowBuilderProps) {
  const { t } = useTranslation(['workflows', 'common']);
  const queryClient = useQueryClient();

  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [triggerType, setTriggerType] = useState(workflow?.trigger_type || 'patient_created');
  const [triggerConfig, setTriggerConfig] = useState<{ days?: number; booking_type?: string; from_stage?: string; to_stage?: string; description?: string }>(
    workflow?.trigger_config || {}
  );
  const [isActive, setIsActive] = useState(workflow?.is_active ?? false);
  const [steps, setSteps] = useState<WorkflowStep[]>(
    existingSteps || []
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setSteps((prev) => {
        const oldIndex = prev.findIndex((s) => s.id === active.id);
        const newIndex = prev.findIndex((s) => s.id === over.id);
        const reordered = arrayMove(prev, oldIndex, newIndex);
        return reordered.map((s, i) => ({ ...s, step_order: i + 1 }));
      });
    },
    []
  );

  const addStep = useCallback(
    (atIndex?: number, actionType = 'send_email') => {
      const newStep: WorkflowStep = {
        id: `temp-${++tempIdCounter}`,
        action_type: actionType,
        template_id: null,
        delay_days: 0,
        delay_hours: 0,
        message_override: null,
        subject_override: null,
        step_order: 0,
        ...(actionType === 'condition'
          ? {
              condition_config: {
                field: 'booking_value' as const,
                operator: '>' as const,
                value: 0,
                true_action: 'send_email',
                false_action: 'send_notification',
              },
            }
          : {}),
      };

      setSteps((prev) => {
        const insertAt = atIndex !== undefined ? atIndex : prev.length;
        const updated = [...prev];
        updated.splice(insertAt, 0, newStep);
        return updated.map((s, i) => ({ ...s, step_order: i + 1 }));
      });
    },
    []
  );

  const updateStep = useCallback((index: number, updatedStep: WorkflowStep) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? updatedStep : s)));
  }, []);

  const deleteStep = useCallback((index: number) => {
    setSteps((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((s, i) => ({ ...s, step_order: i + 1 }));
    });
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Name is required');

      let workflowId = workflow?.id;

      if (workflowId) {
        // Update existing workflow
        const { error } = await supabase
          .from('crm_workflows')
          .update({
            name: name.trim(),
            description: description.trim(),
            trigger_type: triggerType,
            trigger_config: triggerConfig,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', workflowId);
        if (error) throw error;

        // Delete old steps and re-insert
        const { error: deleteError } = await supabase
          .from('crm_workflow_steps')
          .delete()
          .eq('workflow_id', workflowId);
        if (deleteError) throw deleteError;
      } else {
        // Create new workflow
        const { data, error } = await supabase
          .from('crm_workflows')
          .insert({
            name: name.trim(),
            description: description.trim(),
            trigger_type: triggerType,
            trigger_config: triggerConfig,
            is_active: isActive,
          })
          .select('id')
          .single();
        if (error) throw error;
        workflowId = data.id;
      }

      // Insert steps
      if (steps.length > 0) {
        const stepsToInsert = steps.map((s, i) => ({
          workflow_id: workflowId,
          step_order: i + 1,
          action_type: s.action_type,
          template_id: s.template_id,
          delay_days: s.delay_days,
          delay_hours: s.delay_hours,
          message_override: s.message_override,
          subject_override: s.subject_override,
        }));

        const { error: stepsError } = await supabase
          .from('crm_workflow_steps')
          .insert(stepsToInsert);
        if (stepsError) throw stepsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-workflows'] });
      toast.success(
        workflow ? t('workflows:workflowUpdated') : t('workflows:workflowCreated')
      );
      onClose();
    },
    onError: () => {
      toast.error(t('workflows:saveError'));
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">
          {workflow ? t('workflows:editWorkflow') : t('workflows:newWorkflow')}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-1" />
            {t('common:cancel')}
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !name.trim()}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {t('workflows:save')}
          </Button>
        </div>
      </div>

      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('workflows:basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-4">
              <div>
                <Label>{t('workflows:workflowName')}</Label>
                <Input
                  className="mt-1"
                  placeholder={t('workflows:namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label>{t('workflows:description')}</Label>
                <Textarea
                  className="mt-1"
                  rows={2}
                  placeholder={t('workflows:descriptionPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label>{t('workflows:status')}:</Label>
            <Button
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsActive(!isActive)}
            >
              {isActive ? (
                <Badge variant="default">{t('workflows:active')}</Badge>
              ) : (
                <Badge variant="secondary">{t('workflows:draft')}</Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trigger config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('workflows:triggerConfig')}</CardTitle>
        </CardHeader>
        <CardContent>
          <TriggerConfigPanel
            triggerType={triggerType}
            triggerConfig={triggerConfig}
            onTriggerTypeChange={setTriggerType}
            onTriggerConfigChange={setTriggerConfig}
          />
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('workflows:steps')}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => addStep()}>
                <Plus className="h-4 w-4 mr-1" />
                {t('workflows:addStep')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => addStep(undefined, 'condition')}>
                <GitBranch className="h-4 w-4 mr-1" />
                {t('workflows:addCondition', { defaultValue: 'Add Condition' })}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p className="text-sm">{t('workflows:noSteps')}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => addStep()}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('workflows:addFirstStep')}
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={steps.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={step.id}>
                      {/* Add step between button */}
                      {index > 0 && (
                        <div className="flex justify-center py-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-muted-foreground"
                            onClick={() => addStep(index)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {t('workflows:insertStep')}
                          </Button>
                        </div>
                      )}
                      <SortableStepCard
                        step={step}
                        onChange={(s) => updateStep(index, s)}
                        onDelete={() => deleteStep(index)}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Bottom actions */}
      <div className="flex justify-end gap-2 pb-6">
        <Button variant="outline" onClick={onClose}>
          {t('common:cancel')}
        </Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !name.trim()}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          {t('workflows:save')}
        </Button>
      </div>
    </div>
  );
}
