import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, type Locale } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import type { AuditAction, AuditEntityType, AuditLogEntry } from '@/shared/hooks/useAuditTrail';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Download,
  LogIn,
  LogOut,
  UserPlus,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const ACTION_ICONS: Record<AuditAction, React.ElementType> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  view: Eye,
  export: Download,
  login: LogIn,
  logout: LogOut,
  enroll: UserPlus,
  status_change: ArrowRightLeft,
};

const ACTION_COLORS: Record<AuditAction, string> = {
  create: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  view: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  export: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  login: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  logout: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  enroll: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  status_change: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

interface AuditTimelineProps {
  entityType: AuditEntityType;
  entityId: string;
  limit?: number;
  className?: string;
}

export function AuditTimeline({
  entityType,
  entityId,
  limit = 20,
  className,
}: AuditTimelineProps) {
  const { t, i18n } = useTranslation(['audit']);
  const locale = i18n.language === 'fr' ? fr : enUS;

  const { data: entries = [], isLoading, isError } = useQuery({
    queryKey: ['audit-timeline', entityType, entityId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('audit_logs' as any)
          .select('*')
          .eq('entity_type', entityType)
          .eq('entity_id', entityId)
          .order('timestamp', { ascending: false })
          .limit(limit);

        if (error) {
          console.warn('[AuditTimeline] Query error:', error.message);
          return [];
        }
        return (data ?? []) as AuditLogEntry[];
      } catch {
        return [];
      }
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-muted" />
              <div className="h-3 w-1/3 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError || entries.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground py-4 text-center', className)}>
        {t('audit:timeline.noEvents')}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-4">
        {entries.map((entry, index) => (
          <TimelineEntry key={entry.id ?? index} entry={entry} locale={locale} />
        ))}
      </div>
    </div>
  );
}

function TimelineEntry({
  entry,
  locale,
}: {
  entry: AuditLogEntry;
  locale: Locale;
}) {
  const { t } = useTranslation(['audit']);
  const [expanded, setExpanded] = useState(false);
  const Icon = ACTION_ICONS[entry.action] ?? Eye;
  const colorClass = ACTION_COLORS[entry.action] ?? ACTION_COLORS.view;

  const timeAgo = formatDistanceToNow(new Date(entry.timestamp), {
    addSuffix: true,
    locale,
  });

  const hasDetails = entry.details && Object.keys(entry.details).length > 0;

  return (
    <div className="relative flex gap-3 pl-1">
      {/* Icon */}
      <div
        className={cn(
          'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          colorClass
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{entry.user_name}</span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t(`audit:actions.${entry.action}`)}
        </p>

        {hasDetails && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                {t('audit:timeline.hideDetails')}
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                {t('audit:timeline.showDetails')}
              </>
            )}
          </button>
        )}

        {expanded && hasDetails && (
          <pre className="mt-2 rounded-md bg-muted p-2 text-xs overflow-x-auto max-h-40">
            {JSON.stringify(entry.details, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
