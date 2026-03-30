import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared/lib/supabase';
import { usePagination, getPaginationRange } from '@/shared/hooks/usePagination';
import { DataPagination } from '@/shared/components/DataPagination';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Download, X, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { AuditAction, AuditEntityType, AuditLogEntry } from '@/shared/hooks/useAuditTrail';
import { useDebounce } from '@/shared/hooks/useDebounce';

const ALL_ACTIONS: AuditAction[] = [
  'create', 'update', 'delete', 'view', 'export', 'login', 'logout', 'enroll', 'status_change',
];

const ALL_ENTITY_TYPES: AuditEntityType[] = [
  'patient', 'booking', 'campaign', 'workflow', 'report', 'segment', 'communication',
];

const ACTION_BADGE_VARIANT: Record<AuditAction, string> = {
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

interface AuditFilters {
  dateFrom: string;
  dateTo: string;
  action: string;
  entityType: string;
  user: string;
  search: string;
}

const defaultFilters: AuditFilters = {
  dateFrom: '',
  dateTo: '',
  action: '',
  entityType: '',
  user: '',
  search: '',
};

export default function AuditTrailPage() {
  const { t } = useTranslation(['audit']);
  const [filters, setFilters] = useState<AuditFilters>(defaultFilters);
  const debouncedSearch = useDebounce(filters.search, 300);
  const pagination = usePagination({ initialPageSize: 20 });
  const [isExporting, setIsExporting] = useState(false);

  // Reset to first page when filters change
  useEffect(() => {
    pagination.setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.dateFrom, filters.dateTo, filters.action, filters.entityType, filters.user, debouncedSearch]);

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'audit-logs',
      filters.dateFrom,
      filters.dateTo,
      filters.action,
      filters.entityType,
      filters.user,
      debouncedSearch,
      pagination.page,
      pagination.pageSize,
    ],
    queryFn: async () => {
      try {
        let query = supabase
          .from('audit_logs' as any)
          .select('*', { count: 'exact' })
          .order('timestamp', { ascending: false });

        if (filters.dateFrom) {
          query = query.gte('timestamp', new Date(filters.dateFrom).toISOString());
        }
        if (filters.dateTo) {
          // End of day for dateTo
          const end = new Date(filters.dateTo);
          end.setHours(23, 59, 59, 999);
          query = query.lte('timestamp', end.toISOString());
        }
        if (filters.action) {
          query = query.eq('action', filters.action);
        }
        if (filters.entityType) {
          query = query.eq('entity_type', filters.entityType);
        }
        if (filters.user) {
          query = query.ilike('user_email', `%${filters.user}%`);
        }
        if (debouncedSearch) {
          query = query.or(
            `entity_id.ilike.%${debouncedSearch}%,details::text.ilike.%${debouncedSearch}%`
          );
        }

        const { from, to } = getPaginationRange(pagination);
        query = query.range(from, to);

        const { data: rows, error, count } = await query;

        if (error) {
          console.warn('[AuditTrailPage] Query error:', error.message);
          return { rows: [] as AuditLogEntry[], count: 0 };
        }

        return {
          rows: (rows ?? []) as AuditLogEntry[],
          count: count ?? 0,
        };
      } catch {
        return { rows: [] as AuditLogEntry[], count: 0 };
      }
    },
    retry: false,
  });

  const rows = data?.rows ?? [];
  const totalCount = data?.count ?? 0;

  useEffect(() => {
    pagination.setTotalItems(totalCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCount]);

  const handleFilterChange = useCallback(
    (key: keyof AuditFilters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const hasActiveFilters =
    filters.dateFrom || filters.dateTo || filters.action || filters.entityType || filters.user || filters.search;

  const handleExportCsv = useCallback(async () => {
    setIsExporting(true);
    try {
      let query = supabase
        .from('audit_logs' as any)
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5000);

      if (filters.dateFrom) {
        query = query.gte('timestamp', new Date(filters.dateFrom).toISOString());
      }
      if (filters.dateTo) {
        const end = new Date(filters.dateTo);
        end.setHours(23, 59, 59, 999);
        query = query.lte('timestamp', end.toISOString());
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }

      const { data: exportData, error } = await query;

      if (error || !exportData) {
        console.warn('[AuditTrailPage] Export error:', error?.message);
        return;
      }

      const entries = exportData as AuditLogEntry[];
      const csvHeaders = ['Timestamp', 'User', 'Email', 'Action', 'Entity Type', 'Entity ID', 'Details', 'IP'];
      const csvRows = entries.map((entry) => [
        entry.timestamp,
        entry.user_name,
        entry.user_email,
        entry.action,
        entry.entity_type,
        entry.entity_id,
        JSON.stringify(entry.details ?? {}),
        entry.ip_address ?? '',
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `audit-trail-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      setIsExporting(false);
    }
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('audit:title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('audit:description')}</p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportCsv}
          disabled={isExporting}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? t('audit:exporting') : t('audit:exportCsv')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* Date from */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('audit:filters.dateFrom')}</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="h-9"
              />
            </div>

            {/* Date to */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('audit:filters.dateTo')}</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="h-9"
              />
            </div>

            {/* Action filter */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('audit:filters.action')}</label>
              <Select
                value={filters.action || 'all'}
                onValueChange={(v) => handleFilterChange('action', v === 'all' ? '' : v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('audit:filters.allActions')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('audit:filters.allActions')}</SelectItem>
                  {ALL_ACTIONS.map((action) => (
                    <SelectItem key={action} value={action}>
                      {t(`audit:actions.${action}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Entity type filter */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('audit:filters.entityType')}</label>
              <Select
                value={filters.entityType || 'all'}
                onValueChange={(v) => handleFilterChange('entityType', v === 'all' ? '' : v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('audit:filters.allEntities')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('audit:filters.allEntities')}</SelectItem>
                  {ALL_ENTITY_TYPES.map((et) => (
                    <SelectItem key={et} value={et}>
                      {t(`audit:entityTypes.${et}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* User filter */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('audit:filters.user')}</label>
              <Input
                value={filters.user}
                onChange={(e) => handleFilterChange('user', e.target.value)}
                placeholder={t('audit:filters.allUsers')}
                className="h-9"
              />
            </div>

            {/* Search */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('audit:filters.search')}</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder={t('audit:filters.search')}
                  className="h-9 pl-8"
                />
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-3 w-3 mr-1" />
                {t('audit:filters.clearFilters')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">{t('audit:columns.timestamp')}</TableHead>
                <TableHead>{t('audit:columns.user')}</TableHead>
                <TableHead className="w-[120px]">{t('audit:columns.action')}</TableHead>
                <TableHead>{t('audit:columns.entityType')}</TableHead>
                <TableHead>{t('audit:columns.entityId')}</TableHead>
                <TableHead>{t('audit:columns.details')}</TableHead>
                <TableHead className="w-[100px]">{t('audit:columns.ipAddress')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : isError || rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="h-8 w-8" />
                      <p className="font-medium">{t('audit:noResults')}</p>
                      <p className="text-sm">{t('audit:noResultsDesc')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((entry, index) => (
                  <TableRow key={entry.id ?? index}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{entry.user_name}</div>
                      <div className="text-xs text-muted-foreground">{entry.user_email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={ACTION_BADGE_VARIANT[entry.action] ?? ''}
                      >
                        {t(`audit:actions.${entry.action}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {t(`audit:entityTypes.${entry.entity_type}`)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-xs max-w-[150px] truncate">
                      {entry.entity_id}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {entry.details && Object.keys(entry.details).length > 0 ? (
                        <pre className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {JSON.stringify(entry.details)}
                        </pre>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {entry.ip_address ?? '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <DataPagination pagination={pagination} />
    </div>
  );
}
