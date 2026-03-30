import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Plus,
  Zap,
  RefreshCw,
  Pencil,
  Trash2,
  Play,
  Pause,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { WorkflowBuilder } from '@/modules/crm/components/workflows/WorkflowBuilder';
import type { WorkflowStep } from '@/modules/crm/components/workflows/WorkflowStepCard';

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EnrollmentCount {
  workflow_id: string;
}

export default function WorkflowsPage() {
  const { t, i18n } = useTranslation(['workflows', 'common']);
  const dateLocale = i18n.language === 'fr' ? frLocale : enUS;
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [editingSteps, setEditingSteps] = useState<WorkflowStep[] | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch workflows
  const { data: workflows = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['crm-workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_workflows')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Workflow[];
    },
  });

  // Fetch enrollment counts
  const { data: enrollmentCounts = {} } = useQuery({
    queryKey: ['workflow-enrollment-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_workflow_enrollments')
        .select('workflow_id');
      if (error) throw error;

      const counts: Record<string, number> = {};
      (data as EnrollmentCount[]).forEach((e) => {
        counts[e.workflow_id] = (counts[e.workflow_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('crm_workflows')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries({ queryKey: ['crm-workflows'] });
      toast.success(
        is_active ? t('workflows:workflowActivated') : t('workflows:workflowDeactivated')
      );
    },
    onError: () => {
      toast.error(t('workflows:toggleError'));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete steps first
      const { error: stepsError } = await supabase
        .from('crm_workflow_steps')
        .delete()
        .eq('workflow_id', id);
      if (stepsError) throw stepsError;

      const { error } = await supabase
        .from('crm_workflows')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-workflows'] });
      toast.success(t('workflows:workflowDeleted'));
      setDeleteId(null);
    },
    onError: () => {
      toast.error(t('workflows:deleteError'));
    },
  });

  const handleEdit = async (workflow: Workflow) => {
    // Fetch steps for this workflow
    const { data: steps } = await supabase
      .from('crm_workflow_steps')
      .select('*')
      .eq('workflow_id', workflow.id)
      .order('step_order', { ascending: true });

    setEditingWorkflow(workflow);
    setEditingSteps(
      (steps || []).map((s) => ({
        id: s.id,
        action_type: s.action_type,
        template_id: s.template_id,
        delay_days: s.delay_days,
        delay_hours: s.delay_hours,
        message_override: s.message_override,
        subject_override: s.subject_override,
        step_order: s.step_order,
      }))
    );
    setBuilderOpen(true);
  };

  const handleCreate = () => {
    setEditingWorkflow(null);
    setEditingSteps(undefined);
    setBuilderOpen(true);
  };

  const handleCloseBuilder = () => {
    setBuilderOpen(false);
    setEditingWorkflow(null);
    setEditingSteps(undefined);
  };

  // Filter workflows
  const filteredWorkflows = workflows.filter((wf) => {
    const matchesSearch = wf.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && wf.is_active) ||
      (statusFilter === 'draft' && !wf.is_active);
    return matchesSearch && matchesStatus;
  });

  if (builderOpen) {
    return (
      <WorkflowBuilder
        workflow={editingWorkflow || undefined}
        existingSteps={editingSteps}
        onClose={handleCloseBuilder}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('workflows:title')}</h1>
          <p className="text-muted-foreground">{t('workflows:pageDescription')}</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('workflows:newWorkflow')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('workflows:searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('workflows:allStatuses')}</SelectItem>
            <SelectItem value="active">{t('workflows:active')}</SelectItem>
            <SelectItem value="draft">{t('workflows:draft')}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          title={t('workflows:refresh')}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Workflow list */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">{t('workflows:loading')}</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredWorkflows.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Zap className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium text-foreground">
                {t('workflows:noWorkflows')}
              </p>
              <p className="text-muted-foreground text-center max-w-md">
                {t('workflows:emptyDescription')}
              </p>
              <Button variant="outline" onClick={handleCreate} className="mt-2">
                <Plus className="h-4 w-4 mr-1" />
                {t('workflows:createFirst')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredWorkflows.map((wf) => (
            <Card key={wf.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground truncate">
                          {wf.name}
                        </h3>
                        <Badge variant={wf.is_active ? 'default' : 'secondary'}>
                          {wf.is_active
                            ? t('workflows:active')
                            : t('workflows:draft')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        <span>{t(`workflows:trigger_${wf.trigger_type}`)}</span>
                        <span>
                          {enrollmentCounts[wf.id] || 0} {t('workflows:enrolled')}
                        </span>
                        <span>
                          {format(new Date(wf.created_at), 'PP', {
                            locale: dateLocale,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() =>
                        toggleMutation.mutate({
                          id: wf.id,
                          is_active: !wf.is_active,
                        })
                      }
                      title={
                        wf.is_active
                          ? t('workflows:deactivate')
                          : t('workflows:activate')
                      }
                    >
                      {wf.is_active ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEdit(wf)}
                      title={t('workflows:edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(wf.id)}
                      title={t('workflows:delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workflows:deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('workflows:deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('workflows:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
