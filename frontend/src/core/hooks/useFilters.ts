import { useState, useCallback, useEffect } from 'react';

export function useFilters<T extends object>(
  initialFilters: T,
  debounceMs: number = 300
) {
  const [filters, setFilters] = useState<T>(initialFilters);
  const [debouncedFilters, setDebouncedFilters] = useState<T>(initialFilters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [filters, debounceMs]);

  const updateFilters = useCallback((newFilters: Partial<T>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    setDebouncedFilters(initialFilters);
  }, [initialFilters]);

  return {
    filters,
    debouncedFilters,
    updateFilters,
    clearFilters,
  };
}

export function usePagination(initialPage = 1, _initialLimit = 6) {
  const [page, setPage] = useState(initialPage);

  return {
    page,
    setPage,
    nextPage: () => setPage(p => p + 1),
    prevPage: () => setPage(p => Math.max(1, p - 1)),
  };
}