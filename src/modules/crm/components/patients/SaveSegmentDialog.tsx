import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useToast } from '@/shared/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Bookmark, Sparkles, Users } from 'lucide-react';

interface SaveSegmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientIds: string[];
  aiQuery?: string;
  patientCount: number;
  onSuccess?: () => void;
}

export function SaveSegmentDialog({
  open,
  onOpenChange,
  patientIds,
  aiQuery,
  patientCount,
  onSuccess,
}: SaveSegmentDialogProps) {
  const { t } = useTranslation(['segments', 'common']);
  const [name, setName] = useState('');
  const [type, setType] = useState<'static' | 'dynamic'>(aiQuery ? 'dynamic' : 'static');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const segmentData: Record<string, unknown> = {
        name,
        type,
      };

      if (type === 'dynamic' && aiQuery) {
        segmentData.ai_query = aiQuery;
        segmentData.filter_json = { ai_query: aiQuery };
      } else {
        segmentData.patient_ids = patientIds;
        segmentData.filter_json = { patient_ids: patientIds };
      }

      const { error } = await supabase
        .from('crm_segments')
        .insert([segmentData]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: t('segments:saved'),
        description: t('segments:savedDescription', { name }),
      });
      setName('');
      setErrors({});
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: t('common:error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrors({ name: t('segments:nameRequired') });
      return;
    }
    setErrors({});
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            {t('segments:saveSegment')}
          </DialogTitle>
          <DialogDescription>
            {t('segments:saveDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="segment-name">{t('segments:segmentName')}</Label>
            <Input
              id="segment-name"
              placeholder={t('segments:segmentNamePlaceholder')}
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.name; return n; }); }}
              autoFocus
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          {aiQuery && (
            <div className="space-y-3">
              <Label>{t('segments:segmentType')}</Label>
              <RadioGroup
                value={type}
                onValueChange={(v) => setType(v as 'static' | 'dynamic')}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="dynamic" id="dynamic" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="dynamic" className="flex items-center gap-2 cursor-pointer font-medium">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {t('segments:dynamic')}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('segments:dynamicDescription')}
                    </p>
                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono text-muted-foreground">
                      "{aiQuery}"
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="static" id="static" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="static" className="flex items-center gap-2 cursor-pointer font-medium">
                      <Users className="h-4 w-4" />
                      {t('segments:static')}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('segments:staticDescription', { count: patientCount })}
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          {!aiQuery && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{t('segments:patientCount', { count: patientCount })}</span>
                <span className="text-muted-foreground">{t('segments:willBeIncluded')}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saveMutation.isPending}
            >
              {t('common:cancel')}
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={saveMutation.isPending || !name.trim()}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Bookmark className="h-4 w-4 mr-2" />
              )}
              {t('common:save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
