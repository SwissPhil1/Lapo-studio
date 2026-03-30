import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TriggerConfig {
  days?: number;
  booking_type?: string;
  from_stage?: string;
  to_stage?: string;
  description?: string;
}

interface TriggerConfigPanelProps {
  triggerType: string;
  triggerConfig: TriggerConfig;
  onTriggerTypeChange: (type: string) => void;
  onTriggerConfigChange: (config: TriggerConfig) => void;
}

const TRIGGER_TYPES = [
  'patient_created',
  'booking_cancelled',
  'stage_changed',
  'days_since_visit',
  'manual',
] as const;

export function TriggerConfigPanel({
  triggerType,
  triggerConfig,
  onTriggerTypeChange,
  onTriggerConfigChange,
}: TriggerConfigPanelProps) {
  const { t } = useTranslation(['workflows']);

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
    enabled: triggerType === 'stage_changed',
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>{t('workflows:triggerType')}</Label>
        <Select value={triggerType} onValueChange={onTriggerTypeChange}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRIGGER_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`workflows:trigger_${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {triggerType === 'booking_cancelled' && (
        <div>
          <Label>{t('workflows:bookingTypeFilter')}</Label>
          <Input
            className="mt-1"
            placeholder={t('workflows:bookingTypePlaceholder')}
            value={triggerConfig.booking_type || ''}
            onChange={(e) =>
              onTriggerConfigChange({ ...triggerConfig, booking_type: e.target.value })
            }
          />
        </div>
      )}

      {triggerType === 'stage_changed' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t('workflows:fromStage')}</Label>
            <Select
              value={triggerConfig.from_stage || 'any'}
              onValueChange={(val) =>
                onTriggerConfigChange({
                  ...triggerConfig,
                  from_stage: val === 'any' ? undefined : val,
                })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t('workflows:anyStage')}</SelectItem>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('workflows:toStage')}</Label>
            <Select
              value={triggerConfig.to_stage || 'any'}
              onValueChange={(val) =>
                onTriggerConfigChange({
                  ...triggerConfig,
                  to_stage: val === 'any' ? undefined : val,
                })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t('workflows:anyStage')}</SelectItem>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {triggerType === 'days_since_visit' && (
        <div>
          <Label>{t('workflows:daysThreshold')}</Label>
          <Input
            type="number"
            className="mt-1 w-32"
            min={1}
            value={triggerConfig.days || ''}
            onChange={(e) =>
              onTriggerConfigChange({
                ...triggerConfig,
                days: parseInt(e.target.value, 10) || undefined,
              })
            }
            placeholder="30"
          />
        </div>
      )}

      {triggerType === 'manual' && (
        <div>
          <Label>{t('workflows:manualDescription')}</Label>
          <Textarea
            className="mt-1"
            rows={2}
            placeholder={t('workflows:manualDescPlaceholder')}
            value={triggerConfig.description || ''}
            onChange={(e) =>
              onTriggerConfigChange({ ...triggerConfig, description: e.target.value })
            }
          />
        </div>
      )}

      {triggerType === 'patient_created' && (
        <p className="text-sm text-muted-foreground">
          {t('workflows:patientCreatedHint')}
        </p>
      )}
    </div>
  );
}
