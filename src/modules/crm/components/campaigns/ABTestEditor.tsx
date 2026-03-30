import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, FlaskConical } from 'lucide-react';

interface ABVariant {
  variant_name: string;
  subject?: string;
  message_template: string;
  weight: number;
}

interface ABTestEditorProps {
  campaignId: string;
  channel: string;
  onSave: (variants: ABVariant[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ABTestEditor({ campaignId: _campaignId, channel, onSave, open, onOpenChange }: ABTestEditorProps) {
  const { t } = useTranslation(['campaigns', 'common']);
  const [subjectA, setSubjectA] = useState('');
  const [messageA, setMessageA] = useState('');
  const [subjectB, setSubjectB] = useState('');
  const [messageB, setMessageB] = useState('');
  const [weightA, setWeightA] = useState(50);
  const [previewA, setPreviewA] = useState(false);
  const [previewB, setPreviewB] = useState(false);

  const showSubject = channel === 'email';

  const handleWeightAChange = (value: number) => {
    const clamped = Math.min(100, Math.max(0, value));
    setWeightA(clamped);
  };

  const handleSave = () => {
    const variants: ABVariant[] = [
      {
        variant_name: 'A',
        ...(showSubject && subjectA ? { subject: subjectA } : {}),
        message_template: messageA,
        weight: weightA,
      },
      {
        variant_name: 'B',
        ...(showSubject && subjectB ? { subject: subjectB } : {}),
        message_template: messageB,
        weight: 100 - weightA,
      },
    ];
    onSave(variants);
    onOpenChange(false);
  };

  const canSave = messageA.trim().length > 0 && messageB.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            {t('campaigns:abTest')}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="A" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="A">{t('campaigns:variantA')}</TabsTrigger>
            <TabsTrigger value="B">{t('campaigns:variantB')}</TabsTrigger>
          </TabsList>

          <TabsContent value="A" className="space-y-4 mt-4">
            {showSubject && (
              <div className="space-y-2">
                <Label>{t('campaigns:subjectVariant', { variant: 'A' })}</Label>
                <Input
                  value={subjectA}
                  onChange={(e) => setSubjectA(e.target.value)}
                  placeholder={t('campaigns:subjectPlaceholder')}
                />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('campaigns:messageVariant', { variant: 'A' })}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewA(!previewA)}
                  className="h-7 gap-1 text-xs"
                >
                  {previewA ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {previewA ? t('campaigns:edit') : t('campaigns:preview')}
                </Button>
              </div>
              {previewA ? (
                <div className="rounded-lg border bg-muted/30 p-4 min-h-[150px] text-sm whitespace-pre-wrap">
                  {messageA || <span className="text-muted-foreground italic">{t('campaigns:noContent')}</span>}
                </div>
              ) : (
                <Textarea
                  value={messageA}
                  onChange={(e) => setMessageA(e.target.value)}
                  placeholder={t('campaigns:messagePlaceholder')}
                  rows={6}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="B" className="space-y-4 mt-4">
            {showSubject && (
              <div className="space-y-2">
                <Label>{t('campaigns:subjectVariant', { variant: 'B' })}</Label>
                <Input
                  value={subjectB}
                  onChange={(e) => setSubjectB(e.target.value)}
                  placeholder={t('campaigns:subjectPlaceholder')}
                />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('campaigns:messageVariant', { variant: 'B' })}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewB(!previewB)}
                  className="h-7 gap-1 text-xs"
                >
                  {previewB ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {previewB ? t('campaigns:edit') : t('campaigns:preview')}
                </Button>
              </div>
              {previewB ? (
                <div className="rounded-lg border bg-muted/30 p-4 min-h-[150px] text-sm whitespace-pre-wrap">
                  {messageB || <span className="text-muted-foreground italic">{t('campaigns:noContent')}</span>}
                </div>
              ) : (
                <Textarea
                  value={messageB}
                  onChange={(e) => setMessageB(e.target.value)}
                  placeholder={t('campaigns:messagePlaceholder')}
                  rows={6}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Weight distribution */}
        <div className="space-y-3 pt-2 border-t">
          <Label>{t('campaigns:trafficDistribution')}</Label>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm font-medium w-24">{t('campaigns:variantA')}</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={weightA}
                onChange={(e) => handleWeightAChange(parseInt(e.target.value) || 0)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm font-medium w-24">{t('campaigns:variantB')}</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={100 - weightA}
                readOnly
                className="w-20 bg-muted"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary transition-all"
              style={{ width: `${weightA}%` }}
            />
            <div
              className="bg-chart-2 transition-all"
              style={{ width: `${100 - weightA}%` }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common:cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {t('campaigns:saveVariants')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
