import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InternalCalendar } from '@/modules/crm/components/calendar/InternalCalendar';
import { CreateBookingDialog } from '@/modules/crm/components/calendar/CreateBookingDialog';

export default function Calendar() {
  const { t } = useTranslation(['appointments']);
  const [showBooking, setShowBooking] = useState(false);

  return (
    <div className="space-y-4 h-[calc(100vh-180px)]">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {t('appointments:description')}
        </p>
        <Button size="sm" onClick={() => setShowBooking(true)}>
          <CalendarPlus className="mr-1 h-4 w-4" />
          {t('booking.create', { defaultValue: 'New Booking' })}
        </Button>
      </div>
      <InternalCalendar defaultView="month" className="flex-1 min-h-0" />
      {showBooking && (
        <CreateBookingDialog open={showBooking} onOpenChange={setShowBooking} />
      )}
    </div>
  );
}
