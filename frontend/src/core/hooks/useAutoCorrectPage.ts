import { useEffect } from 'react';
import type { PaginatedMeta } from '../types/base.types';

/**
 * Automatically corrects the current page when it exceeds totalPages.
 *
 * Resolves the "empty page" bug: when deleting the last item on the last page,
 * the page number stays the same but the backend returns an empty result.
 * This hook detects that mismatch and adjusts the page to a valid value.
 *
 * @param meta       - PaginatedMeta from the query result (total, page, limit, totalPages)
 * @param page       - Current page number state
 * @param onPageChange - Callback to update the page number (should be stable, use useCallback)
 *
 * @example
 * // After fetching paginated data:
 * const { data } = useIncomesPaginated(filters, currentPage, LIMIT);
 * useAutoCorrectPage(data?.meta, currentPage, onPageChange);
 */
export function useAutoCorrectPage(
  meta: PaginatedMeta | undefined,
  page: number,
  onPageChange: (page: number) => void,
): void {
  useEffect(() => {
    if (!meta) return;

    // No data at all → go to page 1 (show empty state correctly)
    if (meta.totalPages === 0) {
      if (page !== 1) onPageChange(1);
      return;
    }

    // Current page exceeds totalPages (e.g., last item deleted on last page)
    // → go back to the last valid page
    if (page > meta.totalPages) {
      onPageChange(meta.totalPages);
    }
  }, [meta, page, onPageChange]);
}