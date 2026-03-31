import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Mail, Phone, Merge, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  useDuplicateDetection,
  useMergePatients,
  type DuplicateGroup,
  type DuplicatePatient,
} from '@/shared/hooks/useDuplicateDetection';

export default function DuplicatesPage() {
  const { t } = useTranslation();
  const { data: groups = [], isLoading, isError, refetch } = useDuplicateDetection();
  const mergeMutation = useMergePatients();
  const [mergeState, setMergeState] = useState<{
    group: DuplicateGroup;
    primaryId: string;
    secondaryId: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">
            {t('duplicates.title', { defaultValue: 'Duplicate Detection' })}
          </h1>
          <Badge variant="secondary">{groups.length} {t('duplicates.groups', { defaultValue: 'groups' })}</Badge>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          {t('duplicates.rescan', { defaultValue: 'Rescan' })}
        </Button>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
          {t('common.loadError', { defaultValue: 'Failed to load data. Please try again.' })}
        </div>
      )}

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">{t('duplicates.noDuplicates', { defaultValue: 'No duplicates found' })}</p>
            <p className="text-sm">{t('duplicates.allClean', { defaultValue: 'Your patient database looks clean.' })}</p>
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => (
          <DuplicateGroupCard
            key={group.key}
            group={group}
            onMerge={(primaryId, secondaryId) =>
              setMergeState({ group, primaryId, secondaryId })
            }
            t={t}
          />
        ))
      )}

      {/* Merge Confirmation Dialog */}
      <AlertDialog open={!!mergeState} onOpenChange={() => setMergeState(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('duplicates.confirmMerge', { defaultValue: 'Confirm Merge' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {mergeState && (() => {
                const primary = mergeState.group.patients.find(p => p.id === mergeState.primaryId);
                const secondary = mergeState.group.patients.find(p => p.id === mergeState.secondaryId);
                return (
                  <div className="space-y-2 text-left">
                    <p>
                      {t('duplicates.mergeDesc', {
                        defaultValue: 'All records (bookings, communications, tasks) from the secondary patient will be moved to the primary patient. The secondary patient will be archived.',
                      })}
                    </p>
                    <div className="mt-3 space-y-1 text-sm">
                      <p><strong>{t('duplicates.keepAs', { defaultValue: 'Keep' })}:</strong> {primary?.first_name} {primary?.last_name} ({primary?.bookingCount} bookings, {primary?.commCount} comms)</p>
                      <p><strong>{t('duplicates.archive', { defaultValue: 'Archive' })}:</strong> {secondary?.first_name} {secondary?.last_name} ({secondary?.bookingCount} bookings, {secondary?.commCount} comms)</p>
                    </div>
                  </div>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', { defaultValue: 'Cancel' })}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (mergeState) {
                  mergeMutation.mutate({
                    primaryId: mergeState.primaryId,
                    secondaryId: mergeState.secondaryId,
                  });
                  setMergeState(null);
                }
              }}
            >
              {t('duplicates.mergeNow', { defaultValue: 'Merge Now' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DuplicateGroupCard({
  group,
  onMerge,
  t,
}: {
  group: DuplicateGroup;
  onMerge: (primaryId: string, secondaryId: string) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {group.matchType === 'email' ? (
            <Mail className="h-4 w-4 text-blue-500" />
          ) : (
            <Phone className="h-4 w-4 text-green-500" />
          )}
          <CardTitle className="text-base">
            {t('duplicates.matchedBy', { defaultValue: 'Matched by {{type}}', type: group.matchType })}:
            <span className="ml-1 font-mono text-sm text-muted-foreground">{group.matchValue}</span>
          </CardTitle>
          <Badge variant="destructive" className="ml-auto">
            {group.patients.length} {t('duplicates.records', { defaultValue: 'records' })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {group.patients.map((patient, idx) => (
            <PatientCompareCard
              key={patient.id}
              patient={patient}
              isPrimary={idx === 0}
              onKeep={() => {
                const secondary = group.patients.find(p => p.id !== patient.id);
                if (secondary) onMerge(patient.id, secondary.id);
              }}
              t={t}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PatientCompareCard({
  patient,
  isPrimary,
  onKeep,
  t,
}: {
  patient: DuplicatePatient;
  isPrimary: boolean;
  onKeep: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <div className={`rounded-lg border p-4 ${isPrimary ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold">{patient.first_name} {patient.last_name}</p>
          {patient.email && <p className="text-sm text-muted-foreground">{patient.email}</p>}
          {patient.phone && <p className="text-sm text-muted-foreground">{patient.phone}</p>}
        </div>
        {isPrimary && (
          <Badge variant="outline" className="text-xs text-primary border-primary/50">
            {t('duplicates.oldest', { defaultValue: 'Oldest' })}
          </Badge>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>{patient.bookingCount} {t('duplicates.bookings', { defaultValue: 'bookings' })}</span>
        <span>•</span>
        <span>{patient.commCount} {t('duplicates.comms', { defaultValue: 'comms' })}</span>
        <span>•</span>
        <span>{patient.taskCount} {t('duplicates.tasks', { defaultValue: 'tasks' })}</span>
        <span>•</span>
        <span>{t('duplicates.created', { defaultValue: 'Created' })} {format(parseISO(patient.created_at), 'dd MMM yyyy')}</span>
      </div>
      <Button size="sm" className="mt-3 w-full" variant={isPrimary ? 'default' : 'outline'} onClick={onKeep}>
        <Merge className="mr-1 h-3 w-3" />
        {t('duplicates.keepThis', { defaultValue: 'Keep this record' })}
      </Button>
    </div>
  );
}
