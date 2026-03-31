import { useTranslation } from 'react-i18next';
import { Zap, Clock, UserX, RefreshCw, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WORKFLOW_TEMPLATES, type WorkflowTemplate } from '@/shared/lib/workflowTemplates';

const TEMPLATE_ICONS: Record<string, typeof Zap> = {
  'appointment-reminder': Clock,
  'post-treatment-followup': Mail,
  'reactivation-90-days': RefreshCw,
  'no-show-recovery': UserX,
};

interface WorkflowTemplateLibraryProps {
  onUseTemplate: (template: WorkflowTemplate) => void;
}

export function WorkflowTemplateLibrary({ onUseTemplate }: WorkflowTemplateLibraryProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">
          {t('workflowTemplates.title', { defaultValue: 'Workflow Templates' })}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('workflowTemplates.subtitle', { defaultValue: 'Pre-built automations to get started quickly. Click to customize.' })}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {WORKFLOW_TEMPLATES.map((template) => {
          const Icon = TEMPLATE_ICONS[template.id] || Zap;
          return (
            <Card key={template.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">
                      {t(template.nameKey, { defaultValue: template.name })}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t(template.descriptionKey, { defaultValue: template.description })}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {template.steps.length} {t('workflowTemplates.steps', { defaultValue: 'steps' })}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {template.triggerType.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => onUseTemplate(template)}
                >
                  {t('workflowTemplates.useTemplate', { defaultValue: 'Use Template' })}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
