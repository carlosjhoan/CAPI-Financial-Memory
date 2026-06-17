/**
 * Timeline utility functions — pure data transformations for the month-by-month
 * timeline feed. Extracted to pure functions for testability.
 */

// English 3-letter month abbreviations to month number (0-indexed)
const EN_MONTH_TO_NUM: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

const SPANISH_MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export interface AvailableMonth {
  /** 0-indexed month number (0=January) */
  month: number;
  year: number;
  /** Spanish month name (Enero, Febrero...) */
  monthName: string;
}

/**
 * Derive available months from a yearly summary's monthly breakdown.
 * Filters out months with zero/negative amounts, maps English abbreviations
 * to structured month objects, and returns them sorted descending (newest first).
 *
 * @param monthlyBreakdown - Record of month abbreviation → amount (e.g. { Jan: 500, Feb: 0 })
 * @param year - The year these months belong to
 * @returns Sorted array of AvailableMonth (newest first), excluding zero-amount months
 */
export function deriveAvailableMonths(
  monthlyBreakdown: Record<string, number>,
  year: number,
): AvailableMonth[] {
  return Object.entries(monthlyBreakdown)
    .filter(([, amount]) => amount > 0)
    .map(([key]) => {
      const monthNum = EN_MONTH_TO_NUM[key] ?? -1;
      return {
        month: monthNum,
        year,
        monthName: monthNum >= 0 ? SPANISH_MONTH_NAMES[monthNum] : key,
      };
    })
    .filter((m) => m.month >= 0)
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

/** Minimum time a month must be displayed before exhaustion is allowed (Fix B) */
export const MIN_MONTH_DISPLAY_MS = 3000;

/**
 * Pure check for month exhaustion: returns true only when ALL items have been
 * revealed AND the last item has scrolled past (or to) the viewport bottom,
 * AND the minimum display time has elapsed.
 *
 * @param revealedItems - Number of items currently revealed
 * @param totalItems - Total number of items in the current month
 * @param lastItemBottom - getBoundingClientRect().bottom of the last item
 * @param viewportBottom - getBoundingClientRect().bottom of the viewport container
 * @param monthStartedAt - Timestamp (Date.now()) when the current month started displaying
 */
export function isMonthExhausted(
  revealedItems: number,
  totalItems: number,
  lastItemBottom: number,
  viewportBottom: number,
  monthStartedAt: number,
): boolean {
  if (Date.now() - monthStartedAt < MIN_MONTH_DISPLAY_MS) return false;
  return totalItems > 0 && revealedItems >= totalItems && lastItemBottom <= viewportBottom;
}

/**
 * Viewport-full detection: returns true when revealed items have filled
 * approximately `threshold` visible slots.
 *
 * @param revealedItems - Number of items currently revealed
 * @param threshold - Number of items considered "viewport-full" (default 5)
 */
export function isViewportFull(
  revealedItems: number,
  threshold: number = 5,
): boolean {
  return revealedItems >= threshold;
}

/**
 * Schedule a callback after a delay. Returns a cancel function.
 * Used by section hooks for month transition timing.
 *
 * @param callback - Function to call after delay
 * @param delayMs - Delay in milliseconds (default 400)
 * @returns Object with cancel() to clear the timeout
 */
export function scheduleAfterDelay(
  callback: () => void,
  delayMs: number = 400,
): { cancel: () => void } {
  const timerId = setTimeout(callback, delayMs);
  return { cancel: () => clearTimeout(timerId) };
}
