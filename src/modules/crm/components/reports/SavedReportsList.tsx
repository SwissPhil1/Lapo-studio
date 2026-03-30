import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { CustomReport, ReportConfig } from '@/shared/types/reports';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, StarOff, Trash2, ExternalLink, BarChart3, LineChart, PieChart, Table, AreaChart } from 'lucide-react';
import { useAuditTrail } from '@/shared/hooks/useAuditTrail';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { REPORT_SOURCES } from '@/shared/lib/reportSources';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


const chartIcons: Record<string, React.ElementType> = {
  bar: BarChart3,
  line: LineChart,
  area: AreaChart,
  pie: PieChart,
  table: Table,
};

function parseReportConfig(config: unknown): ReportConfig | null {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return null;
  const c = config as Record<string, unknown>;
  if (
    typeof c.source === 'string' &&
    Array.isArray(c.metrics) &&
    typeof c.dimension === 'string' &&
    typeof c.chartType === 'string'
  ) {
    return c as unknown as ReportConfig;
  }
  return null;
}

export function SavedReportsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logAction } = useAuditTrail();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['custom-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_reports')
        .select('*')
        .order('is_favorite', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as CustomReport[];
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from('custom_reports')
        .update({ is_favorite: !isFavorite })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-reports'] });
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_reports')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['custom-reports'] });
      logAction('delete', 'report', id);
      toast.success('Rapport supprimé');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  const handleOpenReport = async (id: string) => {
    // Update last_viewed_at
    await supabase
      .from('custom_reports')
      .update({ last_viewed_at: new Date().toISOString() })
      .eq('id', id);
    
    navigate(`/crm/reports/${id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Aucun rapport personnalisé</h3>
        <p className="text-muted-foreground mt-1">
          Créez votre premier rapport pour commencer
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => {
        const config = parseReportConfig(report.config);
        const ChartIcon = config ? chartIcons[config.chartType] || BarChart3 : BarChart3;
        const sourceDef = config ? REPORT_SOURCES[config.source] : null;

        return (
          <div
            key={report.id}
            className="card-elevated p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
            onClick={() => handleOpenReport(report.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ChartIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{report.name}</h4>
                    {report.is_favorite && (
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {sourceDef?.label || 'Source inconnue'}
                    {config && ` • ${config.metrics.length} métrique(s)`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Modifié {formatDistanceToNow(new Date(report.updated_at), { addSuffix: true, locale: fr })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite.mutate({ id: report.id, isFavorite: report.is_favorite });
                  }}
                >
                  {report.is_favorite ? (
                    <StarOff className="h-4 w-4" />
                  ) : (
                    <Star className="h-4 w-4" />
                  )}
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer ce rapport ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Le rapport "{report.name}" sera définitivement supprimé.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteReport.mutate(report.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button variant="ghost" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
