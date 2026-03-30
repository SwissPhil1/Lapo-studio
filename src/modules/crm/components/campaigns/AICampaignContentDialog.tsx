import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Sparkles, Copy } from 'lucide-react';

interface AICampaignContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel?: 'email' | 'sms' | 'whatsapp';
  onApply?: (content: { subject?: string; body?: string; message?: string }) => void;
}

type ContentType = 'campaign_email' | 'campaign_sms' | 'reactivation' | 'follow_up' | 'promotion';

export function AICampaignContentDialog({ open, onOpenChange, channel = 'email', onApply }: AICampaignContentDialogProps) {
  const { t, i18n } = useTranslation(['campaigns', 'common']);
  const [contentType, setContentType] = useState<ContentType>('campaign_email');
  const [treatmentType, setTreatmentType] = useState('');
  const [tone, setTone] = useState('professional');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string> | null>(null);

  const CONTENT_TYPES: { value: ContentType; label: string }[] = [
    { value: 'campaign_email', label: t('campaigns:contentTypeMarketing') },
    { value: 'campaign_sms', label: t('campaigns:contentTypeSms') },
    { value: 'reactivation', label: t('campaigns:contentTypeReactivation') },
    { value: 'follow_up', label: t('campaigns:contentTypeFollowUp') },
    { value: 'promotion', label: t('campaigns:contentTypePromotion') },
  ];

  const TONES = [
    { value: 'professional', label: t('campaigns:toneProfessional') },
    { value: 'friendly', label: t('campaigns:toneFriendly') },
    { value: 'urgent', label: t('campaigns:toneUrgent') },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-campaign-content', {
        body: {
          type: contentType,
          context: {
            treatment_type: treatmentType || undefined,
            tone,
            language: i18n.language,
            channel,
            additional_info: additionalInfo || undefined,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedContent(data.content);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('campaigns:generateError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedContent && onApply) {
      onApply(generatedContent);
      onOpenChange(false);
    }
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    const text = generatedContent.subject
      ? `${t('campaigns:subject')}: ${generatedContent.subject}\n\n${generatedContent.body}`
      : generatedContent.message || generatedContent.body || '';
    navigator.clipboard.writeText(text);
    toast.success(t('campaigns:copiedToClipboard'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('campaigns:generateWithAI')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('campaigns:contentType')}</Label>
            <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((ct) => (
                  <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('campaigns:targetTreatment')}</Label>
            <Input
              value={treatmentType}
              onChange={(e) => setTreatmentType(e.target.value)}
              placeholder={t('campaigns:targetTreatmentPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('campaigns:tone')}</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONES.map((tn) => (
                  <SelectItem key={tn.value} value={tn.value}>{tn.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('campaigns:additionalInstructions')}</Label>
            <Textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder={t('campaigns:additionalInstructionsPlaceholder')}
              rows={3}
            />
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t('campaigns:generating')}</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> {t('campaigns:generate')}</>
            )}
          </Button>

          {/* Generated content preview */}
          {generatedContent && (
            <div className="mt-4 p-4 rounded-lg bg-secondary/50 border space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">{t('campaigns:generatedContent')}</h4>
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-1" /> {t('campaigns:copy')}
                </Button>
              </div>

              {generatedContent.subject && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t('campaigns:subject')} :</p>
                  <p className="text-sm bg-background p-2 rounded">{generatedContent.subject}</p>
                </div>
              )}

              {(generatedContent.body || generatedContent.message) && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t('campaigns:message')} :</p>
                  <p className="text-sm bg-background p-2 rounded whitespace-pre-wrap">
                    {generatedContent.body || generatedContent.message}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('campaigns:close')}</Button>
          {generatedContent && onApply && (
            <Button onClick={handleApply}>
              {t('campaigns:applyContent')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
