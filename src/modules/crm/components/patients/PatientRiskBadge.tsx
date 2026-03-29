import { cn } from '@/shared/lib/utils';

interface PatientRiskBadgeProps {
  score: number | null;
}

export function PatientRiskBadge({ score }: PatientRiskBadgeProps) {
  if (score === null) return null;

  const getRiskInfo = (value: number) => {
    if (value > 70) {
      return {
        label: 'Risque: \u00c9lev\u00e9',
        className: 'bg-destructive/15 text-destructive',
      };
    }
    if (value >= 40) {
      return {
        label: 'Risque: Moyen',
        className: 'bg-warning/15 text-warning',
      };
    }
    return {
      label: 'Risque: Faible',
      className: 'bg-success/15 text-success',
    };
  };

  const { label, className } = getRiskInfo(score);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        className
      )}
    >
      {label}
    </span>
  );
}
