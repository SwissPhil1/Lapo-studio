import { useTranslation } from 'react-i18next';
import { InternalCalendar } from '@/modules/crm/components/calendar/InternalCalendar';

export default function Calendar() {
  const { t } = useTranslation(['appointments']);

  return (
    <div className="space-y-4 h-[calc(100vh-180px)]">
      <p className="text-muted-foreground">
        {t('appointments:description')}
      </p>
      <InternalCalendar defaultView="month" className="flex-1 min-h-0" />
    </div>
  );
}
