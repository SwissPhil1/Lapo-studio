import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useConsentFormTemplates,
  useCreateConsentTemplate,
} from '@/shared/hooks/useConsentForms';
import type { ConsentFormField } from '@/shared/lib/consentFormTypes';

export default function ConsentFormsPage() {
  const { t } = useTranslation();
  const { data: templates = [], isLoading } = useConsentFormTemplates();
  const createTemplate = useCreateConsentTemplate();
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{t('consent.title', { defaultValue: 'Consent Forms' })}</h1>
          <Badge variant="secondary">{templates.length}</Badge>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t('consent.createTemplate', { defaultValue: 'New Template' })}
        </Button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">{t('consent.noTemplates', { defaultValue: 'No consent form templates yet' })}</p>
            <p className="text-sm">{t('consent.createFirst', { defaultValue: 'Create a template to start collecting patient consents.' })}</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="mr-1 h-4 w-4" />
              {t('consent.createTemplate', { defaultValue: 'New Template' })}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map(template => (
            <Card key={template.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <Badge variant={template.active ? 'default' : 'secondary'}>
                    {template.active
                      ? t('consent.active', { defaultValue: 'Active' })
                      : t('consent.inactive', { defaultValue: 'Inactive' })}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{template.fields?.length || 0} {t('consent.fields', { defaultValue: 'fields' })}</span>
                  <span>•</span>
                  <span>{t('consent.created', { defaultValue: 'Created' })} {format(parseISO(template.created_at), 'dd MMM yyyy')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Template Dialog */}
      <CreateTemplateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSave={(name, description, fields) => {
          createTemplate.mutate(
            { name, description, fields },
            { onSuccess: () => setShowCreate(false) }
          );
        }}
        isPending={createTemplate.isPending}
        t={t}
      />
    </div>
  );
}

function CreateTemplateDialog({
  open,
  onOpenChange,
  onSave,
  isPending,
  t,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (name: string, description: string, fields: ConsentFormField[]) => void;
  isPending: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<ConsentFormField[]>([]);
  const [newFieldType, setNewFieldType] = useState<ConsentFormField['type']>('checkbox');
  const [newFieldLabel, setNewFieldLabel] = useState('');

  const addField = () => {
    if (!newFieldLabel.trim()) return;
    setFields(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: newFieldType,
        label: newFieldLabel.trim(),
        required: newFieldType !== 'info',
      },
    ]);
    setNewFieldLabel('');
  };

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const handleSave = () => {
    if (!name.trim() || fields.length === 0) return;
    onSave(name.trim(), description.trim(), fields);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{t('consent.newTemplate', { defaultValue: 'New Consent Form Template' })}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('consent.templateName', { defaultValue: 'Template Name' })}</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('consent.namePlaceholder', { defaultValue: 'e.g. Laser Treatment Consent' })}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('consent.description', { defaultValue: 'Description' })}</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Add Field */}
          <div className="space-y-2">
            <Label>{t('consent.addField', { defaultValue: 'Add Field' })}</Label>
            <div className="flex gap-2">
              <Select value={newFieldType} onValueChange={v => setNewFieldType(v as ConsentFormField['type'])}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkbox">{t('consent.checkbox', { defaultValue: 'Checkbox' })}</SelectItem>
                  <SelectItem value="text">{t('consent.textField', { defaultValue: 'Text' })}</SelectItem>
                  <SelectItem value="textarea">{t('consent.textareaField', { defaultValue: 'Long Text' })}</SelectItem>
                  <SelectItem value="signature">{t('consent.signature', { defaultValue: 'Signature' })}</SelectItem>
                  <SelectItem value="info">{t('consent.info', { defaultValue: 'Info Text' })}</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="flex-1"
                value={newFieldLabel}
                onChange={e => setNewFieldLabel(e.target.value)}
                placeholder={t('consent.fieldLabel', { defaultValue: 'Field label...' })}
                onKeyDown={e => e.key === 'Enter' && addField()}
              />
              <Button variant="outline" onClick={addField}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Fields list */}
          {fields.length > 0 && (
            <div className="space-y-2 rounded-lg border p-3">
              {fields.map((field) => (
                <div key={field.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{field.type}</Badge>
                    <span>{field.label}</span>
                    {field.required && <span className="text-red-500">*</span>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeField(field.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || fields.length === 0 || isPending}>
            {isPending
              ? t('consent.creating', { defaultValue: 'Creating...' })
              : t('consent.save', { defaultValue: 'Create Template' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
