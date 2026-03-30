import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';

interface PatientRiskBadgeProps {
  score: number | null;
}

export function PatientRiskBadge({ score }: PatientRiskBadgeProps) {
  const { t } = useTranslation();

  if (score === null) return null;

  const getRiskInfo = (value: number) => {
    if (value > 70) {
      return {
        label: t('common.accessibility.riskHigh'),
        className: 'bg-destructive/15 text-destructive',
      };
    }
    if (value >= 40) {
      return {
        label: t('common.accessibility.riskMedium'),
        className: 'bg-warning/15 text-warning',
      };
    }
    return {
      label: t('common.accessibility.riskLow'),
      className: 'bg-success/15 text-success',
    };
  };

  const { label, className } = getRiskInfo(score);

  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        className
      )}
    >
      {label}
    </span>
  );
}
