import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface CohortData {
  cohort: string;
  total: number;
  months: number[]; // retention % for month 0, 1, 2, etc.
}

function getRetentionColor(value: number): string {
  if (value >= 80) return 'bg-success/80 text-success-foreground';
  if (value >= 60) return 'bg-success/60 text-success-foreground';
  if (value >= 40) return 'bg-success/40 text-foreground';
  if (value >= 20) return 'bg-warning/40 text-foreground';
  if (value > 0) return 'bg-destructive/30 text-foreground';
  return 'bg-muted/30 text-muted-foreground';
}

export function CohortAnalysis() {
  const { t, i18n } = useTranslation(['analytics']);
  const dateLocale = i18n.language === 'fr' ? frLocale : enUS;

  const { data: cohorts, isLoading } = useQuery({
    queryKey: ['cohort-analysis'],
    queryFn: async () => {
      const now = new Date();
      const cohortMonths = 6;

      // Fetch all patients created in the last 6 months
      const sixMonthsAgo = startOfMonth(subMonths(now, cohortMonths - 1));
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id, created_at')
        .eq('is_test', false)
        .gte('created_at', sixMonthsAgo.toISOString());

      if (patientsError) throw patientsError;

      // Fetch all bookings for those patients
      const patientIds = patients?.map((p) => p.id) || [];
      if (patientIds.length === 0) return [];

      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('patient_id, booking_date')
        .eq('is_test', false)
        .in('patient_id', patientIds)
        .gte('booking_date', sixMonthsAgo.toISOString());

      if (bookingsError) throw bookingsError;

      // Build booking lookup: patient_id -> set of month keys (YYYY-MM)
      const bookingsByPatient = new Map<string, Set<string>>();
      bookings?.forEach((b) => {
        const monthKey = b.booking_date.substring(0, 7); // "YYYY-MM"
        if (!bookingsByPatient.has(b.patient_id)) {
          bookingsByPatient.set(b.patient_id, new Set());
        }
        bookingsByPatient.get(b.patient_id)!.add(monthKey);
      });

      // Build cohorts
      const result: CohortData[] = [];

      for (let i = cohortMonths - 1; i >= 0; i--) {
        const cohortDate = subMonths(now, i);
        const cohortStart = startOfMonth(cohortDate);
        const cohortEnd = endOfMonth(cohortDate);
        // Patients created in this cohort month
        const cohortPatients = patients?.filter((p) => {
          const createdAt = new Date(p.created_at);
          return createdAt >= cohortStart && createdAt <= cohortEnd;
        }) || [];

        const total = cohortPatients.length;
        if (total === 0) {
          result.push({
            cohort: format(cohortDate, 'MMM yyyy', { locale: dateLocale }),
            total: 0,
            months: [],
          });
          continue;
        }

        // For each subsequent month, count how many cohort patients had a booking
        const monthsRetention: number[] = [];
        const maxFollowUpMonths = i + 1; // how many months of data we can have

        for (let m = 0; m < Math.min(maxFollowUpMonths, cohortMonths); m++) {
          const checkDate = subMonths(now, i - m);
          const checkMonthKey = format(checkDate, 'yyyy-MM');

          const activeCount = cohortPatients.filter((p) => {
            const patientBookings = bookingsByPatient.get(p.id);
            return patientBookings?.has(checkMonthKey) || false;
          }).length;

          monthsRetention.push(Math.round((activeCount / total) * 100));
        }

        result.push({
          cohort: format(cohortDate, 'MMM yyyy', { locale: dateLocale }),
          total,
          months: monthsRetention,
        });
      }

      return result;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!cohorts || cohorts.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        <p>{t('analytics:noDataAvailable')}</p>
      </div>
    );
  }

  const maxMonths = Math.max(...cohorts.map((c) => c.months.length));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">
              {t('analytics:cohortAnalysis', { defaultValue: 'Cohort' })}
            </th>
            <th className="text-center py-2 px-3 font-medium text-muted-foreground">
              {t('analytics:cohortNewPatients', { defaultValue: 'New patients' })}
            </th>
            {Array.from({ length: maxMonths }, (_, i) => (
              <th key={i} className="text-center py-2 px-3 font-medium text-muted-foreground">
                {t('analytics:cohortMonth', { defaultValue: 'Month' })} {i}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort) => (
            <tr key={cohort.cohort} className="border-b border-border/50">
              <td className="py-2 px-3 font-medium text-foreground whitespace-nowrap">
                {cohort.cohort}
              </td>
              <td className="text-center py-2 px-3 text-foreground">
                {cohort.total}
              </td>
              {Array.from({ length: maxMonths }, (_, i) => {
                const value = cohort.months[i];
                const hasValue = value !== undefined;
                return (
                  <td key={i} className="py-1 px-1 text-center">
                    {hasValue ? (
                      <div
                        className={cn(
                          'rounded px-2 py-1.5 text-xs font-medium mx-auto max-w-[60px]',
                          getRetentionColor(value)
                        )}
                      >
                        {value}%
                      </div>
                    ) : (
                      <div className="text-muted-foreground/30 text-xs">-</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
