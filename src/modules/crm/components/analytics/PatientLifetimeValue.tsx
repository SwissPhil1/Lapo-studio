import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/shared/lib/format';
import { differenceInYears } from 'date-fns';
import { BOOKING_STATUS } from '@/shared/lib/bookingStatus';
import { useTranslation } from 'react-i18next';

const AGE_GROUPS = [
  { label: '18-34', min: 18, max: 34 },
  { label: '35-49', min: 35, max: 49 },
  { label: '50+', min: 50, max: 150 },
];

export function PatientLifetimeValue() {
  const { t } = useTranslation(['analytics']);
  const { data, isLoading } = useQuery({
    queryKey: ['patient-ltv'],
    queryFn: async () => {
      // Get all bookings with patient info
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          booking_value,
          patient_id,
          status,
          patient:patient_id (
            gender,
            date_of_birth
          )
        `)
        .eq('is_test', false)
        .eq('status', BOOKING_STATUS.COMPLETED);

      if (error) throw error;

      const today = new Date();

      // Calculate LTV per patient
      const patientLTV = new Map<string, { 
        total: number; 
        gender: string | null; 
        ageGroup: string | null;
      }>();

      bookings?.forEach((b: any) => {
        const patientId = b.patient_id;
        const existing = patientLTV.get(patientId) || { 
          total: 0, 
          gender: b.patient?.gender?.toLowerCase() || null,
          ageGroup: null,
        };

        // Calculate age group
        if (b.patient?.date_of_birth) {
          const age = differenceInYears(today, new Date(b.patient.date_of_birth));
          const group = AGE_GROUPS.find(g => age >= g.min && age <= g.max);
          existing.ageGroup = group?.label || null;
        }

        existing.total += b.booking_value || 0;
        patientLTV.set(patientId, existing);
      });

      // Calculate averages by gender
      const genderLTV: Record<string, { total: number; count: number }> = {
        female: { total: 0, count: 0 },
        male: { total: 0, count: 0 },
      };

      // Calculate averages by age group
      const ageLTV: Record<string, { total: number; count: number }> = {};
      AGE_GROUPS.forEach(g => {
        ageLTV[g.label] = { total: 0, count: 0 };
      });

      patientLTV.forEach(patient => {
        if (patient.gender && genderLTV[patient.gender]) {
          genderLTV[patient.gender].total += patient.total;
          genderLTV[patient.gender].count++;
        }
        if (patient.ageGroup && ageLTV[patient.ageGroup]) {
          ageLTV[patient.ageGroup].total += patient.total;
          ageLTV[patient.ageGroup].count++;
        }
      });

      const genderData = [
        { 
          name: 'Femmes', 
          ltv: genderLTV.female.count > 0 
            ? Math.round(genderLTV.female.total / genderLTV.female.count) 
            : 0,
          color: '#FF2E93',
        },
        { 
          name: 'Hommes', 
          ltv: genderLTV.male.count > 0 
            ? Math.round(genderLTV.male.total / genderLTV.male.count) 
            : 0,
          color: '#06B6D4',
        },
      ];

      const ageData = AGE_GROUPS.map((g, i) => ({
        name: g.label,
        ltv: ageLTV[g.label].count > 0 
          ? Math.round(ageLTV[g.label].total / ageLTV[g.label].count) 
          : 0,
        color: ['#7C3AED', '#9F5AFF', '#22D3EE'][i],
      }));

      // Overall average LTV
      const allLTVs = Array.from(patientLTV.values()).map(p => p.total);
      const avgLTV = allLTVs.length > 0 
        ? Math.round(allLTVs.reduce((a, b) => a + b, 0) / allLTVs.length) 
        : 0;

      return { genderData, ageData, avgLTV, totalPatients: patientLTV.size };
    },
  });

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        {t('analytics:noDataAvailable')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall LTV */}
      <div className="bg-primary/10 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">LTV moyen par patient</p>
          <p className="text-3xl font-bold text-foreground">{formatCurrency(data.avgLTV)}</p>
          <p className="text-xs text-muted-foreground">{data.totalPatients} patients analysés</p>
        </div>
        <TrendingUp className="h-10 w-10 text-primary" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* By Gender */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">LTV par genre</h4>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data.genderData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                width={50}
                tickFormatter={(v) => `${Math.round(v/1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: any) => [formatCurrency(value), 'LTV moyen']}
              />
              <Bar dataKey="ltv" radius={[4, 4, 0, 0]}>
                {data.genderData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Age */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">LTV par âge</h4>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data.ageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                width={50}
                tickFormatter={(v) => `${Math.round(v/1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: any) => [formatCurrency(value), 'LTV moyen']}
              />
              <Bar dataKey="ltv" radius={[4, 4, 0, 0]}>
                {data.ageData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
