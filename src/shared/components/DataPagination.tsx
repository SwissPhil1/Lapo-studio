
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination';
import type { UsePaginationReturn } from '@/shared/hooks/usePagination';

interface DataPaginationProps {
  pagination: UsePaginationReturn;
  className?: string;
  showPageSize?: boolean;
  showRange?: boolean;
  pageSizeOptions?: number[];
}

/**
 * Data Pagination Component
 *
 * A complete pagination UI that integrates with the usePagination hook.
 * Displays page numbers, navigation buttons, page size selector, and range info.
 */
export function DataPagination({
  pagination,
  className,
  showPageSize = true,
  showRange = true,
  pageSizeOptions = [10, 20, 50, 100],
}: DataPaginationProps) {
  const {
    page,
    pageSize,
    totalPages,
    totalItems,
    hasNextPage,
    hasPrevPage,
    pageNumbers,
    range,
    setPage,
    setPageSize,
    firstPage,
    lastPage,
  } = pagination;

  if (totalItems === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4',
        className
      )}
    >
      {/* Range info */}
      {showRange && (
        <div className="text-sm text-muted-foreground">
          Affichage de {range.from} à {range.to} sur {totalItems} résultats
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Page size selector */}
        {showPageSize && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Par page:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Navigation */}
        <Pagination>
          <PaginationContent>
            {/* First page */}
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={firstPage}
                disabled={!hasPrevPage}
                title="Première page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>

            {/* Previous page */}
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(page - 1)}
                disabled={!hasPrevPage}
                title="Page précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>

            {/* Page numbers */}
            <div className="hidden sm:flex items-center">
              {pageNumbers[0] > 1 && (
                <>
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => { e.preventDefault(); setPage(1); }}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  {pageNumbers[0] > 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                </>
              )}

              {pageNumbers.map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href="#"
                    isActive={pageNum === page}
                    onClick={(e) => { e.preventDefault(); setPage(pageNum); }}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => { e.preventDefault(); setPage(totalPages); }}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}
            </div>

            {/* Mobile page indicator */}
            <div className="sm:hidden px-2 text-sm text-muted-foreground">
              {page} / {totalPages}
            </div>

            {/* Next page */}
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(page + 1)}
                disabled={!hasNextPage}
                title="Page suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </PaginationItem>

            {/* Last page */}
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={lastPage}
                disabled={!hasNextPage}
                title="Dernière page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
