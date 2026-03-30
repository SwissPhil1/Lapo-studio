import { Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { QuickNoteWidget } from './QuickNoteWidget';
import { ActiveTasksWidget } from './ActiveTasksWidget';
import { PatientWorkflows } from '@/modules/crm/components/workflows/PatientWorkflows';

interface PatientSidebarProps {
  patientId: string;
  referral: {
    referrerName?: string;
    discountPercent?: number;
  } | null;
}

export function PatientSidebar({
  patientId,
  referral,
}: PatientSidebarProps) {
  const { t } = useTranslation(['patients']);
  return (
    <div className="space-y-4">
      {/* Quick Note */}
      <div className="card-elevated p-4">
        <QuickNoteWidget patientId={patientId} />
      </div>

      {/* Workflows */}
      <div className="card-elevated p-4">
        <PatientWorkflows patientId={patientId} />
      </div>
      <div className="card-elevated p-4">
        <ActiveTasksWidget patientId={patientId} />
      </div>

      {/* Referral Info */}
      {referral && referral.referrerName && (
        <div className="card-elevated p-4 space-y-2">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Gift className="h-4 w-4" />
            {t('patients:referral')}
          </h3>
          <div className="text-sm text-muted-foreground">
            {t('patients:referredBy')} <span className="font-medium text-foreground">{referral.referrerName}</span>
          </div>
          {referral.discountPercent && (
            <div className="text-sm">
              <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
                -{referral.discountPercent}% {t('patients:discount')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
