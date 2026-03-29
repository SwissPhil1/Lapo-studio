import { useState, useMemo, useCallback } from 'react';

export interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationActions {
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotalItems: (total: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
}

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  totalItems?: number;
}

export interface UsePaginationReturn extends PaginationState, PaginationActions {
  offset: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  pageNumbers: number[];
  range: { from: number; to: number };
}

/**
 * Custom hook for pagination logic
 *
 * @example
 * const pagination = usePagination({ initialPageSize: 10, totalItems: 100 });
 *
 * // In your query
 * const { data } = useQuery({
 *   queryKey: ['items', pagination.page, pagination.pageSize],
 *   queryFn: () => fetchItems({ offset: pagination.offset, limit: pagination.pageSize }),
 * });
 *
 * // Update total when data loads
 * useEffect(() => {
 *   if (data?.count) pagination.setTotalItems(data.count);
 * }, [data?.count]);
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    initialPageSize = 10,
    totalItems: initialTotalItems = 0,
  } = options;

  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(initialTotalItems);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // Calculate visible page numbers (show max 5 pages)
  const pageNumbers = useMemo(() => {
    const maxVisible = 5;
    const pages: number[] = [];

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, page - Math.floor(maxVisible / 2));
      const end = Math.min(totalPages, start + maxVisible - 1);
      const adjustedStart = Math.max(1, end - maxVisible + 1);

      for (let i = adjustedStart; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }, [page, totalPages]);

  // Calculate display range
  const range = useMemo(() => {
    const from = totalItems === 0 ? 0 : offset + 1;
    const to = Math.min(offset + pageSize, totalItems);
    return { from, to };
  }, [offset, pageSize, totalItems]);

  const setPage = useCallback(
    (newPage: number) => {
      const validPage = Math.max(1, Math.min(newPage, totalPages));
      setPageState(validPage);
    },
    [totalPages]
  );

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPageState(1); // Reset to first page when changing page size
  }, []);

  const nextPage = useCallback(() => {
    if (hasNextPage) setPageState((p) => p + 1);
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) setPageState((p) => p - 1);
  }, [hasPrevPage]);

  const firstPage = useCallback(() => setPageState(1), []);

  const lastPage = useCallback(() => setPageState(totalPages), [totalPages]);

  return {
    // State
    page,
    pageSize,
    totalItems,
    totalPages,
    offset,
    hasNextPage,
    hasPrevPage,
    pageNumbers,
    range,
    // Actions
    setPage,
    setPageSize,
    setTotalItems,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
  };
}

/**
 * Helper to create Supabase range query parameters
 */
export function getPaginationRange(pagination: UsePaginationReturn): { from: number; to: number } {
  return {
    from: pagination.offset,
    to: pagination.offset + pagination.pageSize - 1,
  };
}
