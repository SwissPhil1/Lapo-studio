import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, CheckSquare, ArrowRight, Clock, Bell, Trash2, GripVertical, GitBranch } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '@/shared/lib/utils';

export type ConditionField = 'booking_value' | 'days_since_last_visit' | 'referral_count' | 'patient_age';
export type ConditionOperator = '>' | '<' | '==' | '>=' | '<=' | '!=';

export interface ConditionConfig {
  field: ConditionField;
  operator: ConditionOperator;
  value: number;
  true_action: string;
  false_action: string;
}

export interface WorkflowStep {
  id: string;
  action_type: string;
  template_id: string | null;
  delay_days: number;
  delay_hours: number;
  message_override: string | null;
  subject_override: string | null;
  step_order: number;
  condition_config?: ConditionConfig;
}

interface WorkflowStepCardProps {
  step: WorkflowStep;
  onChange: (step: WorkflowStep) => void;
  onDelete: () => void;
  dragHandleProps?: Record<string, unknown>;
}

const ACTION_TYPES = ['send_email', 'create_task', 'update_stage', 'wait', 'send_notification', 'condition'] as const;

const ACTION_ICONS: Record<string, typeof Mail> = {
  send_email: Mail,
  create_task: CheckSquare,
  update_stage: ArrowRight,
  wait: Clock,
  send_notification: Bell,
  condition: GitBranch,
};

const CONDITION_FIELDS: ConditionField[] = ['booking_value', 'days_since_last_visit', 'referral_count', 'patient_age'];
const CONDITION_OPERATORS: ConditionOperator[] = ['>', '<', '==', '>=', '<=', '!='];
const BRANCH_ACTIONS = ['send_email', 'send_notification', 'create_task'] as const;

export const WorkflowStepCard = forwardRef<HTMLDivElement, WorkflowStepCardProps>(
  function WorkflowStepCard({ step, onChange, onDelete, dragHandleProps }, ref) {
    const { t } = useTranslation(['workflows']);
    const Icon = ACTION_ICONS[step.action_type] || Clock;

    const { data: stages = [] } = useQuery({
      queryKey: ['pipeline-stages'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('pipeline_stages')
          .select('id, name')
          .order('order_index', { ascending: true });
        if (error) throw error;
        return data as { id: string; name: string }[];
      },
      enabled: step.action_type === 'update_stage',
    });

    return (
      <Card ref={ref} className="relative">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag handle */}
            <div
              {...dragHandleProps}
              className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="h-5 w-5" />
            </div>

            {/* Icon */}
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-3">
              {/* Action type selector */}
              <div>
                <Label className="text-xs">{t('workflows:actionType')}</Label>
                <Select
                  value={step.action_type}
                  onValueChange={(val) =>
                    onChange({ ...step, action_type: val, template_id: null, message_override: null, subject_override: null })
                  }
                >
                  <SelectTrigger className="mt-1 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`workflows:action_${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action-specific config */}
              {step.action_type === 'send_email' && (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">{t('workflows:emailSubject')}</Label>
                    <Input
                      className="mt-1 h-8 text-sm"
                      placeholder={t('workflows:emailSubjectPlaceholder')}
                      value={step.subject_override || ''}
                      onChange={(e) => onChange({ ...step, subject_override: e.target.value || null })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t('workflows:emailBody')}</Label>
                    <Textarea
                      className="mt-1 text-sm"
                      rows={2}
                      placeholder={t('workflows:emailBodyPlaceholder')}
                      value={step.message_override || ''}
                      onChange={(e) => onChange({ ...step, message_override: e.target.value || null })}
                    />
                  </div>
                </div>
              )}

              {step.action_type === 'create_task' && (
                <div>
                  <Label className="text-xs">{t('workflows:taskDescription')}</Label>
                  <Input
                    className="mt-1 h-8 text-sm"
                    placeholder={t('workflows:taskDescPlaceholder')}
                    value={step.message_override || ''}
                    onChange={(e) => onChange({ ...step, message_override: e.target.value || null })}
                  />
                </div>
              )}

              {step.action_type === 'update_stage' && (
                <div>
                  <Label className="text-xs">{t('workflows:targetStage')}</Label>
                  <Select
                    value={step.template_id || ''}
                    onValueChange={(val) => onChange({ ...step, template_id: val })}
                  >
                    <SelectTrigger className="mt-1 h-8 text-sm">
                      <SelectValue placeholder={t('workflows:selectStage')} />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {step.action_type === 'send_notification' && (
                <div>
                  <Label className="text-xs">{t('workflows:notificationMessage')}</Label>
                  <Input
                    className="mt-1 h-8 text-sm"
                    placeholder={t('workflows:notificationPlaceholder')}
                    value={step.message_override || ''}
                    onChange={(e) => onChange({ ...step, message_override: e.target.value || null })}
                  />
                </div>
              )}

              {step.action_type === 'condition' && (
                <div className="space-y-3">
                  {/* Condition row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">{t('workflows:conditionField', { defaultValue: 'Field' })}</Label>
                      <Select
                        value={step.condition_config?.field || 'booking_value'}
                        onValueChange={(v) => onChange({
                          ...step,
                          condition_config: { ...step.condition_config!, field: v as ConditionField },
                        })}
                      >
                        <SelectTrigger className="mt-1 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_FIELDS.map((f) => (
                            <SelectItem key={f} value={f}>
                              {t(`workflows:fields.${f}`, { defaultValue: f.replace(/_/g, ' ') })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">{t('workflows:operator', { defaultValue: 'Operator' })}</Label>
                      <Select
                        value={step.condition_config?.operator || '>'}
                        onValueChange={(v) => onChange({
                          ...step,
                          condition_config: { ...step.condition_config!, operator: v as ConditionOperator },
                        })}
                      >
                        <SelectTrigger className="mt-1 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_OPERATORS.map((op) => (
                            <SelectItem key={op} value={op}>{op}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">{t('workflows:value', { defaultValue: 'Value' })}</Label>
                      <Input
                        type="number"
                        className="mt-1 h-8 text-xs"
                        value={step.condition_config?.value ?? 0}
                        onChange={(e) => onChange({
                          ...step,
                          condition_config: { ...step.condition_config!, value: Number(e.target.value) },
                        })}
                      />
                    </div>
                  </div>

                  {/* Branches */}
                  <div className="space-y-2">
                    <div className={cn('ml-4 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3')}>
                      <Label className="text-xs font-semibold text-emerald-600">
                        {t('workflows:ifTrue', { defaultValue: 'If true →' })}
                      </Label>
                      <Select
                        value={step.condition_config?.true_action || 'send_email'}
                        onValueChange={(v) => onChange({
                          ...step,
                          condition_config: { ...step.condition_config!, true_action: v },
                        })}
                      >
                        <SelectTrigger className="mt-1 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BRANCH_ACTIONS.map((a) => (
                            <SelectItem key={a} value={a}>
                              {t(`workflows:action_${a}`, { defaultValue: a.replace(/_/g, ' ') })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className={cn('ml-4 rounded-md border border-destructive/30 bg-destructive/5 p-3')}>
                      <Label className="text-xs font-semibold text-destructive">
                        {t('workflows:ifFalse', { defaultValue: 'If false →' })}
                      </Label>
                      <Select
                        value={step.condition_config?.false_action || 'send_notification'}
                        onValueChange={(v) => onChange({
                          ...step,
                          condition_config: { ...step.condition_config!, false_action: v },
                        })}
                      >
                        <SelectTrigger className="mt-1 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BRANCH_ACTIONS.map((a) => (
                            <SelectItem key={a} value={a}>
                              {t(`workflows:action_${a}`, { defaultValue: a.replace(/_/g, ' ') })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Delay config (for all types except wait, which is delay-only) */}
              <div className="flex items-center gap-3">
                <div>
                  <Label className="text-xs">{t('workflows:delayDays')}</Label>
                  <Input
                    type="number"
                    className="mt-1 h-8 w-20 text-sm"
                    min={0}
                    value={step.delay_days}
                    onChange={(e) =>
                      onChange({ ...step, delay_days: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">{t('workflows:delayHours')}</Label>
                  <Input
                    type="number"
                    className="mt-1 h-8 w-20 text-sm"
                    min={0}
                    max={23}
                    value={step.delay_hours}
                    onChange={(e) =>
                      onChange({ ...step, delay_hours: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Delete button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
);
