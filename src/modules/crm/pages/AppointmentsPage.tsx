import { InternalCalendar } from '@/modules/crm/components/calendar/InternalCalendar';

export default function Calendar() {
  return (
    <div className="space-y-4 h-[calc(100vh-180px)]">
      <p className="text-muted-foreground">
        Calendrier des rendez-vous sécurisé depuis la base de données.
      </p>
      <InternalCalendar defaultView="month" className="flex-1 min-h-0" />
    </div>
  );
}
