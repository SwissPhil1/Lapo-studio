// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { Loader2, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface FieldStat {
  label: string;
  filled: number;
  total: number;
  percentage: number;
}

export function DatabaseHealthMetrics() {
  const { data, isLoading } = useQuery({
    queryKey: ['database-health'],
    queryFn: async () => {
      const { data: patients, error } = await supabase
        .from('patients')
        .select('gender, date_of_birth, city, country, phone, email')
        .eq('is_test', false)
        .eq('is_business_contact', false);

      if (error) throw error;

      const total = patients?.length || 0;

      const fields: FieldStat[] = [
        {
          label: 'Genre',
          filled: patients?.filter(p => p.gender).length || 0,
          total,
          percentage: 0,
        },
        {
          label: 'Date de naissance',
          filled: patients?.filter(p => p.date_of_birth).length || 0,
          total,
          percentage: 0,
        },
        {
          label: 'Ville',
          filled: patients?.filter(p => p.city).length || 0,
          total,
          percentage: 0,
        },
        {
          label: 'Pays',
          filled: patients?.filter(p => p.country).length || 0,
          total,
          percentage: 0,
        },
        {
          label: 'Téléphone',
          filled: patients?.filter(p => p.phone).length || 0,
          total,
          percentage: 0,
        },
        {
          label: 'Email',
          filled: patients?.filter(p => p.email).length || 0,
          total,
          percentage: 0,
        },
      ];

      fields.forEach(f => {
        f.percentage = f.total > 0 ? Math.round((f.filled / f.total) * 100) : 0;
      });

      // Overall completeness
      const allFieldsTotal = fields.reduce((sum, f) => sum + f.total, 0);
      const allFieldsFilled = fields.reduce((sum, f) => sum + f.filled, 0);
      const overallCompleteness = allFieldsTotal > 0 
        ? Math.round((allFieldsFilled / allFieldsTotal) * 100) 
        : 0;

      return { fields, total, overallCompleteness };
    },
  });

  if (isLoading) {
    return (
      <div className="h-[200px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'text-success';
    if (percentage >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-success';
    if (percentage >= 50) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Score de complétude global</p>
            <p className="text-2xl font-bold text-foreground">{data.overallCompleteness}%</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 ${getStatusColor(data.overallCompleteness)}`}>
          {data.overallCompleteness >= 70 ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">
            {data.overallCompleteness >= 70 ? 'Bon' : 'À améliorer'}
          </span>
        </div>
      </div>

      {/* Field Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        {data.fields.map((field, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">{field.label}</span>
              <span className={`font-medium ${getStatusColor(field.percentage)}`}>
                {field.percentage}%
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${getProgressColor(field.percentage)}`}
                style={{ width: `${field.percentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {field.filled} / {field.total} patients
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Des données complètes permettent des analyses plus précises et des campagnes mieux ciblées
      </p>
    </div>
  );
}
