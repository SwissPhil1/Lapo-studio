import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { toast } from 'sonner';

export interface DuplicateGroup {
  key: string;
  matchType: 'email' | 'phone';
  matchValue: string;
  patients: DuplicatePatient[];
}

export interface DuplicatePatient {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  normalized_email: string | null;
  normalized_phone: string | null;
  created_at: string;
  bookingCount: number;
  commCount: number;
  taskCount: number;
}

export function useDuplicateDetection() {
  return useQuery<DuplicateGroup[]>({
    queryKey: ['duplicate-detection'],
    queryFn: async () => {
      // Fetch all non-deleted patients with normalized fields
      const { data: patients, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email, phone, normalized_email, normalized_phone, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!patients || patients.length === 0) return [];

      // Group by normalized_email
      const emailGroups = new Map<string, typeof patients>();
      const phoneGroups = new Map<string, typeof patients>();

      for (const p of patients) {
        if (p.normalized_email) {
          const group = emailGroups.get(p.normalized_email) || [];
          group.push(p);
          emailGroups.set(p.normalized_email, group);
        }
        if (p.normalized_phone) {
          const group = phoneGroups.get(p.normalized_phone) || [];
          group.push(p);
          phoneGroups.set(p.normalized_phone, group);
        }
      }

      // Collect duplicate groups (>1 patient with same value)
      const duplicates: DuplicateGroup[] = [];
      const seenPatientPairs = new Set<string>();

      for (const [email, group] of emailGroups) {
        if (group.length < 2) continue;
        const pairKey = group.map(p => p.id).sort().join('-');
        if (seenPatientPairs.has(pairKey)) continue;
        seenPatientPairs.add(pairKey);

        duplicates.push({
          key: `email-${email}`,
          matchType: 'email',
          matchValue: email,
          patients: group.map(p => ({
            ...p,
            bookingCount: 0,
            commCount: 0,
            taskCount: 0,
          })),
        });
      }

      for (const [phone, group] of phoneGroups) {
        if (group.length < 2) continue;
        const pairKey = group.map(p => p.id).sort().join('-');
        if (seenPatientPairs.has(pairKey)) continue;
        seenPatientPairs.add(pairKey);

        duplicates.push({
          key: `phone-${phone}`,
          matchType: 'phone',
          matchValue: phone,
          patients: group.map(p => ({
            ...p,
            bookingCount: 0,
            commCount: 0,
            taskCount: 0,
          })),
        });
      }

      // Fetch record counts for all duplicate patients
      const allIds = duplicates.flatMap(g => g.patients.map(p => p.id));
      if (allIds.length > 0) {
        const [bookings, comms, tasks] = await Promise.all([
          supabase.from('bookings').select('patient_id').in('patient_id', allIds),
          supabase.from('crm_communication_logs').select('patient_id').in('patient_id', allIds),
          supabase.from('reactivation_tasks').select('patient_id').in('patient_id', allIds),
        ]);

        const countMap = (data: { patient_id: string }[] | null) => {
          const map = new Map<string, number>();
          (data || []).forEach(r => map.set(r.patient_id, (map.get(r.patient_id) || 0) + 1));
          return map;
        };

        const bookingCounts = countMap(bookings.data);
        const commCounts = countMap(comms.data);
        const taskCounts = countMap(tasks.data);

        for (const group of duplicates) {
          for (const p of group.patients) {
            p.bookingCount = bookingCounts.get(p.id) || 0;
            p.commCount = commCounts.get(p.id) || 0;
            p.taskCount = taskCounts.get(p.id) || 0;
          }
        }
      }

      return duplicates;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useMergePatients() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      primaryId,
      secondaryId,
    }: {
      primaryId: string;
      secondaryId: string;
    }) => {
      // Move all related records from secondary to primary
      const updates = await Promise.all([
        supabase.from('bookings').update({ patient_id: primaryId }).eq('patient_id', secondaryId),
        supabase.from('crm_communication_logs').update({ patient_id: primaryId }).eq('patient_id', secondaryId),
        supabase.from('reactivation_tasks').update({ patient_id: primaryId }).eq('patient_id', secondaryId),
        supabase.from('pipeline_patients').update({ patient_id: primaryId }).eq('patient_id', secondaryId),
        supabase.from('referrals').update({ patient_id: primaryId }).eq('patient_id', secondaryId),
      ]);

      for (const result of updates) {
        if (result.error) throw result.error;
      }

      // Soft-delete secondary patient
      const { error } = await supabase
        .from('patients')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', secondaryId);

      if (error) throw error;
      return { primaryId, secondaryId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicate-detection'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patients merged successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
