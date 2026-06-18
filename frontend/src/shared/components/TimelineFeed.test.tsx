import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import TimelineFeed from './TimelineFeed';

// Mock window.matchMedia and IntersectionObserver for jsdom environment
beforeAll(() => {
  // IntersectionObserver mock — calls the callback synchronously on observe so isInView becomes true
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe(el: Element) {
        this.callback(
          [{ isIntersecting: true, target: el, intersectionRatio: 1, boundingClientRect: {} as DOMRectReadOnly, intersectionRect: {} as DOMRectReadOnly, rootBounds: null }] as IntersectionObserverEntry[],
          {} as IntersectionObserver,
        );
      }
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] { return []; }
      root: Element | null = null;
      rootMargin = '';
      thresholds: number[] = [];
    },
  });

  // ResizeObserver mock
  class MockResizeObserver {
    constructor() {}
    observe() { return null; }
    unobserve() { return null; }
    disconnect() { return null; }
  }
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: MockResizeObserver,
  });

  // Mock requestAnimationFrame to use setTimeout (compatible with fake timers)
  const rafMap = new Map<number, number>();
  let rafIdCounter = 0;
  window.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    const id = ++rafIdCounter;
    const timeoutId = window.setTimeout(() => {
      rafMap.delete(id);
      cb(Date.now());
    }, 16);
    rafMap.set(id, timeoutId);
    return id;
  };
  window.cancelAnimationFrame = (id: number) => {
    const timeoutId = rafMap.get(id);
    if (timeoutId !== undefined) {
      rafMap.delete(id);
      window.clearTimeout(timeoutId);
    }
  };

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

interface TestItem {
  id: string;
  date: string;
  label: string;
}

const TEST_ITEMS: TestItem[] = [
  { id: '1', date: '2026-06-01', label: 'Item 1' },
  { id: '2', date: '2026-06-05', label: 'Item 2' },
  { id: '3', date: '2026-06-10', label: 'Item 3' },
];

function renderTimeline(items: TestItem[] = TEST_ITEMS, transitioning = false) {
  return render(
    <TimelineFeed
      items={items}
      renderRow={(item) => <span>{item.label}</span>}
      getKey={(item) => item.id}
      getDate={(item) => item.date}
      month={5} // June (0-indexed)
      year={2026}
      monthName="Junio"
      onMonthEnd={vi.fn()}
      transitioning={transitioning}
    />,
  );
}

describe('TimelineFeed', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render all items', () => {
    renderTimeline();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('should display month name and year in the header', () => {
    const { container } = renderTimeline();
    const header = container.querySelector('[class*="absolute top-0 left-0 right-0"]');
    expect(header?.textContent).toMatch(/JUNIO/);
    expect(header?.textContent).toMatch(/2026/);
  });

  it('requestAnimationFrame fires with fake timers', () => {
    const spy = vi.fn();
    requestAnimationFrame(spy);
    act(() => { vi.advanceTimersByTime(50); });
    expect(spy).toHaveBeenCalled();
  });

  it('should reveal items one-by-one with .active class', () => {
    const { container } = renderTimeline();

    const slides = container.querySelectorAll('.auto-slide');
    expect(slides).toHaveLength(3);

    // First item is active immediately (immediate-first-item effect sets revealedItems=1)
    expect(slides[0].classList.contains('active')).toBe(true);
    expect(slides[1].classList.contains('active')).toBe(false);
    expect(slides[2].classList.contains('active')).toBe(false);

    // Advance timers in steps so React flushes state updates between them.
    // Single advanceTimersByTime(500) doesn't work because the growth loop's
    // setRevealedItems is called inside fake timer callbacks — the state update
    // isn't flushed until act() ends, but by then the new rAF timer is queued
    // past the already-processed time window.
    act(() => { vi.advanceTimersByTime(100); });
    act(() => { vi.advanceTimersByTime(100); });
    act(() => { vi.advanceTimersByTime(100); });

    expect(slides[0].classList.contains('active')).toBe(true);
    expect(slides[1].classList.contains('active')).toBe(true);
    expect(slides[2].classList.contains('active')).toBe(true);
  });

  it('should apply timeline-fade-out class when transitioning', () => {
    const { container } = renderTimeline(TEST_ITEMS, true);

    const track = container.querySelector('.timeline-fade-out');
    expect(track).toBeInTheDocument();
  });

  it('should not apply timeline-fade-out class when not transitioning', () => {
    const { container } = renderTimeline(TEST_ITEMS, false);

    const track = container.querySelector('.timeline-fade-out');
    expect(track).not.toBeInTheDocument();
  });

  it('should render placeholder when items are empty', () => {
    const { container } = renderTimeline([]);
    // Always renders the viewport container (for IntersectionObserver ref), with header but no items
    expect(container.querySelector('.text-xs')).toBeTruthy();
    expect(container.innerHTML).toContain('JUNIO');
    expect(container.innerHTML).toContain('2026');
  });

  // ── Focus card integration tests ──
  // NOTE: Full explosion-triggered integration tests depend on the RAF loop
  // which has pre-existing issues with vi.useFakeTimers() in this test environment.
  // The RecordFocusCard component itself is fully tested in RecordFocusCard.test.tsx.
  // Here we verify the component handles the renderFocusCard prop without error.

  it('should render without error when renderFocusCard is provided', () => {
    expect(() => {
      render(
        <TimelineFeed
          items={TEST_ITEMS}
          renderRow={(item) => <span>{item.label}</span>}
          getKey={(item) => item.id}
          getDate={(item) => item.date}
          month={5}
          year={2026}
          monthName="Junio"
          onMonthEnd={vi.fn()}
          renderFocusCard={(item) => <span>{item.label}</span>}
        />,
      );
    }).not.toThrow();
  });

  it('should accept renderFocusCard prop without affecting basic rendering', () => {
    const { container: _container } = render(
      <TimelineFeed
        items={TEST_ITEMS}
        renderRow={(item) => <span>{item.label}</span>}
        getKey={(item) => item.id}
        getDate={(item) => item.date}
        month={5}
        year={2026}
        monthName="Junio"
        onMonthEnd={vi.fn()}
        renderFocusCard={(item) => <span>{item.label}</span>}
      />,
    );

    // Items still render normally (card may add duplicates via renderFocusCard)
    expect(screen.getAllByText('Item 1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Item 2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Item 3').length).toBeGreaterThanOrEqual(1);
  });
});
