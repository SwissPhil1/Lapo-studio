import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface DrillDownColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

export interface DrillDownData {
  title: string;
  subtitle?: string;
  columns: DrillDownColumn[];
  rows: Record<string, any>[];
}

interface DrillDownPanelProps {
  data: DrillDownData | null;
  onClose: () => void;
}

export function DrillDownPanel({ data, onClose }: DrillDownPanelProps) {
  const { t } = useTranslation(['analytics']);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (data) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [data, onClose]);

  if (!data) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30 animate-fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-card border-l shadow-xl transform transition-transform duration-300 ease-out animate-slide-in-right overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{data.title}</h3>
            {data.subtitle && (
              <p className="text-sm text-muted-foreground">{data.subtitle}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Summary */}
        <div className="px-4 py-2 bg-muted/50 border-b text-sm text-muted-foreground">
          {t('analytics:drillDown.recordCount', { count: data.rows.length })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {data.rows.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              {t('analytics:drillDown.noRecords')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {data.columns.map((col) => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row, idx) => (
                  <TableRow key={idx}>
                    {data.columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.format ? col.format(row[col.key]) : (row[col.key] ?? '-')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </>
  );
}
