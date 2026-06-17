import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deriveAvailableMonths, isMonthExhausted, scheduleAfterDelay, isViewportFull } from '../timeline';

describe('deriveAvailableMonths', () => {
  it('should return sorted months with positive amounts', () => {
    const breakdown: Record<string, number> = {
      Jan: 500, Feb: 300, Mar: 0, Apr: 200,
    };
    const result = deriveAvailableMonths(breakdown, 2026);

    expect(result).toHaveLength(3);
    // Sorted descending: Apr, Feb, Jan
    expect(result[0]).toEqual({ month: 3, year: 2026, monthName: 'Abril' });
    expect(result[1]).toEqual({ month: 1, year: 2026, monthName: 'Febrero' });
    expect(result[2]).toEqual({ month: 0, year: 2026, monthName: 'Enero' });
  });

  it('should filter out months with zero amount', () => {
    const breakdown: Record<string, number> = {
      Mar: 0, Apr: 0, May: 0,
    };
    const result = deriveAvailableMonths(breakdown, 2026);

    expect(result).toHaveLength(0);
  });

  it('should handle empty object', () => {
    const result = deriveAvailableMonths({}, 2026);

    expect(result).toHaveLength(0);
  });

  it('should handle mixed years when called per-year', () => {
    // Simulating two separate calls for different years
    const year1 = deriveAvailableMonths({ Jun: 100, Dec: 200 }, 2026);
    const year2 = deriveAvailableMonths({ Jan: 50, Mar: 75 }, 2025);

    expect(year1).toHaveLength(2);
    expect(year1[0]).toEqual({ month: 11, year: 2026, monthName: 'Diciembre' });
    expect(year1[1]).toEqual({ month: 5, year: 2026, monthName: 'Junio' });

    expect(year2).toHaveLength(2);
    expect(year2[0]).toEqual({ month: 2, year: 2025, monthName: 'Marzo' });
    expect(year2[1]).toEqual({ month: 0, year: 2025, monthName: 'Enero' });
  });

  it('should include months with negative amounts? - actually filter them out', () => {
    // Per spec: only > 0 counts as "with data"
    const breakdown: Record<string, number> = {
      Jan: -100, Feb: 50,
    };
    const result = deriveAvailableMonths(breakdown, 2026);
    expect(result).toHaveLength(1);
    expect(result[0].month).toBe(1); // Febrero
  });
});

describe('isViewportFull', () => {
  it('should return true when revealed items meet threshold', () => {
    expect(isViewportFull(5, 5)).toBe(true);
  });

  it('should return false when revealed items are below threshold', () => {
    expect(isViewportFull(3, 5)).toBe(false);
  });

  it('should use default threshold of 5', () => {
    expect(isViewportFull(5)).toBe(true);
    expect(isViewportFull(4)).toBe(false);
  });
});

describe('scheduleAfterDelay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call callback after specified delay', () => {
    const callback = vi.fn();
    scheduleAfterDelay(callback, 400);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not call callback before delay elapses', () => {
    const callback = vi.fn();
    scheduleAfterDelay(callback, 400);
    vi.advanceTimersByTime(399);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should cancel the timeout when cancel is called', () => {
    const callback = vi.fn();
    const { cancel } = scheduleAfterDelay(callback, 400);
    cancel();
    vi.advanceTimersByTime(400);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should use default delay of 400ms', () => {
    const callback = vi.fn();
    scheduleAfterDelay(callback);
    vi.advanceTimersByTime(400);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('isMonthExhausted', () => {
  // Use a timestamp far enough in the past so the MIN_MONTH_DISPLAY_MS guard passes
  const oldMonthStart = Date.now() - 10000;

  it('should return true when all items revealed and last item past viewport', () => {
    expect(isMonthExhausted(5, 5, -50, 0, oldMonthStart)).toBe(true);
  });

  it('should return false when not all items revealed', () => {
    expect(isMonthExhausted(3, 5, -50, 0, oldMonthStart)).toBe(false);
  });

  it('should return false when all items revealed but last item still in viewport', () => {
    expect(isMonthExhausted(5, 5, 200, 100, oldMonthStart)).toBe(false);
  });

  it('should return true when all revealed and last item exactly at viewport bottom', () => {
    // Edge case: lastItemBottom == viewportBottom means item has just crossed
    expect(isMonthExhausted(5, 5, 0, 0, oldMonthStart)).toBe(true);
  });

  it('should return false with zero items if revealedItems < totalItems', () => {
    // With empty month, we'd have 0 total items — never "exhausted" because
    // no items were ever revealed
    expect(isMonthExhausted(0, 0, 0, 100, oldMonthStart)).toBe(false);
  });

  it('should return false if minimum display time has not elapsed', () => {
    // monthStartedAt is NOW — guard should block exhaustion
    const now = Date.now();
    expect(isMonthExhausted(5, 5, -50, 0, now)).toBe(false);
  });
});
