import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface GuideStepCardProps {
  stepNumber: number;
  icon: ReactNode;
  action: string;
  tip?: string;
  linkTo?: string;
}

export function GuideStepCard({ stepNumber, icon, action, tip, linkTo }: GuideStepCardProps) {
  const { t } = useTranslation(['guide']);
  const navigate = useNavigate();

  return (
    <div className="flex gap-4 py-4">
      {/* Step number */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
        {stepNumber}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-primary shrink-0">{icon}</span>
          <p
            className="text-sm font-medium text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: action.replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>'),
            }}
          />
        </div>
        {tip && (
          <div className={cn('ml-6 rounded-lg bg-accent/50 px-3 py-2')}>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">{t('guide:tip')}: </span>
              {tip}
            </p>
          </div>
        )}
        {linkTo && (
          <div className="ml-6 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-primary hover:text-primary"
              onClick={() => navigate(linkTo)}
            >
              {t('guide:goThere')}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
