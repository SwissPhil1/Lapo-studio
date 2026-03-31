import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { CalendarPlus, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/shared/lib/supabase';
import { useCreateBooking } from '@/shared/hooks/useCreateBooking';

interface CreateBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedPatientId?: string;
  preselectedPatientName?: string;
  preselectedDate?: string;
}

export function CreateBookingDialog({
  open,
  onOpenChange,
  preselectedPatientId,
  preselectedPatientName,
  preselectedDate,
}: CreateBookingDialogProps) {
  const { t } = useTranslation();
  const createBooking = useCreateBooking();

  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<{
    id: string;
    name: string;
  } | null>(
    preselectedPatientId
      ? { id: preselectedPatientId, name: preselectedPatientName || '' }
      : null
  );
  const [service, setService] = useState('');
  const [bookingDate, setBookingDate] = useState(preselectedDate || '');
  const [bookingTime, setBookingTime] = useState('');
  const [notes, setNotes] = useState('');

  // Patient search
  const { data: searchResults = [] } = useQuery({
    queryKey: ['patient-search', patientSearch],
    queryFn: async () => {
      if (patientSearch.length < 2) return [];
      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name')
        .is('deleted_at', null)
        .or(`first_name.ilike.%${patientSearch}%,last_name.ilike.%${patientSearch}%,email.ilike.%${patientSearch}%`)
        .limit(10);
      return data || [];
    },
    enabled: patientSearch.length >= 2 && !selectedPatient,
  });

  // Services list from existing bookings
  const { data: services = [] } = useQuery({
    queryKey: ['booking-services'],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select('service')
        .not('service', 'is', null)
        .limit(500);

      const unique = [...new Set((data || []).map(b => b.service).filter(Boolean))];
      return unique.sort();
    },
    staleTime: 30 * 60 * 1000,
  });

  const handleSubmit = () => {
    if (!selectedPatient || !service || !bookingDate) return;

    createBooking.mutate(
      {
        patient_id: selectedPatient.id,
        service,
        booking_date: bookingDate,
        booking_time: bookingTime,
        notes,
        patient_name: selectedPatient.name,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    if (!preselectedPatientId) setSelectedPatient(null);
    setPatientSearch('');
    setService('');
    setBookingDate(preselectedDate || '');
    setBookingTime('');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            {t('booking.create', { defaultValue: 'New Booking' })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Patient Search */}
          <div className="space-y-2">
            <Label>{t('booking.patient', { defaultValue: 'Patient' })}</Label>
            {selectedPatient ? (
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-sm font-medium">{selectedPatient.name}</span>
                {!preselectedPatientId && (
                  <Button size="sm" variant="ghost" onClick={() => setSelectedPatient(null)}>
                    {t('common.change', { defaultValue: 'Change' })}
                  </Button>
                )}
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={t('booking.searchPatient', { defaultValue: 'Search patient...' })}
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => {
                          setSelectedPatient({ id: p.id, name: `${p.first_name} ${p.last_name}` });
                          setPatientSearch('');
                        }}
                      >
                        {p.first_name} {p.last_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Service */}
          <div className="space-y-2">
            <Label>{t('booking.service', { defaultValue: 'Service' })}</Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger>
                <SelectValue placeholder={t('booking.selectService', { defaultValue: 'Select service...' })} />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('booking.date', { defaultValue: 'Date' })}</Label>
              <Input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('booking.time', { defaultValue: 'Time' })}</Label>
              <Input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t('booking.notes', { defaultValue: 'Notes' })}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('booking.notesPlaceholder', { defaultValue: 'Optional notes...' })}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPatient || !service || !bookingDate || createBooking.isPending}
          >
            {createBooking.isPending
              ? t('booking.creating', { defaultValue: 'Creating...' })
              : t('booking.create', { defaultValue: 'Create Booking' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
