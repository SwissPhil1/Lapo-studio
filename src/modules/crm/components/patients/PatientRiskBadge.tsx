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
        className: 'bg-red-500/15 text-red-600 dark:text-red-400',
      };
    }
    if (value >= 40) {
      return {
        label: 'Risque: Moyen',
        className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      };
    }
    return {
      label: 'Risque: Faible',
      className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
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
