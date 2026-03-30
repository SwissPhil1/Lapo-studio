import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string | React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
}

export function DataTable<T>({
  data,
  columns,
  loading,
  pageSize = 10,
  onRowClick,
  rowClassName,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (columnKey: string, sortable?: boolean) => {
    if (!sortable) return;
    
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = a[sortColumn as keyof T];
    const bValue = b[sortColumn as keyof T];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    
    const comparison = aStr.localeCompare(bStr, undefined, { numeric: true });
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = sortedData.slice(startIndex, endIndex);

  const handleRowKeyDown = (e: React.KeyboardEvent, row: T, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick?.(row);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextRow = (e.currentTarget.parentElement as HTMLElement)?.children[Math.min(index + 1, currentData.length - 1)] as HTMLElement;
      nextRow?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevRow = (e.currentTarget.parentElement as HTMLElement)?.children[Math.max(index - 1, 0)] as HTMLElement;
      prevRow?.focus();
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key, column.sortable)}
                      aria-label={t('common.accessibility.sortBy', { column: typeof column.header === 'string' ? column.header : column.key })}
                      aria-sort={sortColumn === column.key ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                      className="flex items-center gap-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
                    >
                      {column.header}
                      {sortColumn === column.key ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-50" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody aria-busy={loading} aria-live="polite">
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center" role="status" aria-label={t('common.accessibility.loadingSpinner')}>
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="sr-only">{t('common.accessibility.tableLoading')}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : currentData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t('common.noData')}
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((row, index) => (
                <TableRow
                  key={index}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? "button" : undefined}
                  aria-label={onRowClick ? t('common.accessibility.tableRowClickable') : undefined}
                  className={`${onRowClick ? "cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" : ""} ${rowClassName?.(row) || ""}`}
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={onRowClick ? (e) => handleRowKeyDown(e, row, index) : undefined}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key}>{column.cell(row)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-between" aria-label={t('common.accessibility.pageInfo', { current: currentPage, total: totalPages })}>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {t('common.accessibility.showingResults', { start: startIndex + 1, end: Math.min(endIndex, sortedData.length), total: sortedData.length })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label={t('common.accessibility.previousPage')}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="text-sm text-foreground" aria-current="page">
              {t('common.accessibility.pageInfo', { current: currentPage, total: totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label={t('common.accessibility.nextPage')}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
