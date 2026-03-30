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
import { Mail, CheckSquare, ArrowRight, Clock, Bell, Trash2, GripVertical } from 'lucide-react';
import { forwardRef } from 'react';

export interface WorkflowStep {
  id: string;
  action_type: string;
  template_id: string | null;
  delay_days: number;
  delay_hours: number;
  message_override: string | null;
  subject_override: string | null;
  step_order: number;
}

interface WorkflowStepCardProps {
  step: WorkflowStep;
  onChange: (step: WorkflowStep) => void;
  onDelete: () => void;
  dragHandleProps?: Record<string, unknown>;
}

const ACTION_TYPES = ['send_email', 'create_task', 'update_stage', 'wait', 'send_notification'] as const;

const ACTION_ICONS: Record<string, typeof Mail> = {
  send_email: Mail,
  create_task: CheckSquare,
  update_stage: ArrowRight,
  wait: Clock,
  send_notification: Bell,
};

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
