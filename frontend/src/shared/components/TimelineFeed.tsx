import React, { useRef, useState, useEffect, useCallback, useId } from 'react';
import { isMonthExhausted, isViewportFull, MIN_MONTH_DISPLAY_MS } from '../../core/utils/timeline';
import RecordFocusCard from './RecordFocusCard';
import BeamSvg from './BeamSvg';
import './TimelineFeed.css';

// ==========================================
// TYPES
// ==========================================

export interface TimelineFeedProps<T> {
  items: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  getKey: (item: T) => string;
  getDate: (item: T) => string;
  /** Optional tailwind dot color class per item — e.g. 'bg-red-500' for active, 'bg-green-500' for paid */
  getStatusDot?: (item: T) => string | undefined;
  /** Optional pocket/allocation label — rendered as a subtitle below renderRow */
  renderPocket?: (item: T) => React.ReactNode;
  /** Optional value/amount renderer — revealed last in auto-play progressive sequence */
  renderValue?: (item: T) => React.ReactNode;
  /** Optional focus card renderer — shown with glassmorphism overlay when a dot explodes */
  renderFocusCard?: (item: T) => React.ReactNode;
  /** Accent RGB para la corriente del borde — ej: "22,163,74" para verde */
  accentRgb?: string;

  // ── Month identity (replaces internal groups computation) ──
  /** 0-indexed month number */
  month: number;
  year: number;
  /** Spanish month name (Enero, Febrero...) */
  monthName: string;

  // ── Exhaustion and transition ──
  /** Fired when all items revealed AND last item scrolled past viewport */
  onMonthEnd?: () => void;
  /** When true, apply fade-out class and suppress reveal timer */
  transitioning?: boolean;
}

// ==========================================
// CONSTANTS
// ==========================================

const ITEM_HEIGHT = 72;
const VISIBLE_ITEMS = 5;
const PX_PER_SECOND = 30;
const ITEMS_BEFORE_SCROLL = 5; // viewport-full threshold
const YEAR_HEADER_H = 44;
const DIVIDER_Y = 28;          // pt-2(8) + h-4(16) + mt-1(4) — donde arranca el divider del header
const SVG_TOP_OFFSET = YEAR_HEADER_H - DIVIDER_Y; // 16 — el SVG del glow line se extiende hacia arriba hasta el divider

// ==========================================
// COMPONENT
// ==========================================

function TimelineFeed<T>({
  items,
  renderRow,
  getKey,
  getDate,
  getStatusDot,
  renderPocket,
  renderValue,
  renderFocusCard,
  accentRgb,
  month,
  year: yearProp,
  monthName,
  onMonthEnd,
  transitioning = false,
}: TimelineFeedProps<T>) {

  // ── Refs ────────────────────────────────────
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const currentPosRef = useRef(0);
  const lastTimeRef = useRef(0);
  const isPausedRef = useRef(false);
  const rafRef = useRef<number>();
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const contentHeightRef = useRef(0);
  const touchStartYRef = useRef(0);
  const monthEndFiredRef = useRef(false);
  /** Generation counter: prevents checkMonthEnd from reading stale revealedItems
   *  after items/year/month change. Incremented in the reset effect, then
   *  checked in checkMonthEnd — only evaluates exhaustion once revealedItems
   *  has been flushed to 0 for the current generation. */
  const itemsGenerationRef = useRef(0);
  const checkedGenerationRef = useRef(-1);
  /** Tracks when the current month started displaying (Fix B) */
  const monthStartTimeRef = useRef(Date.now());
  /** Tracks when the LAST item was revealed — used to give its CSS animation
   *  time to complete before allowing month exhaustion. */
  const lastRevealTimeRef = useRef(Date.now());
  /** Continuous growth height — updated per frame via RAF, applied directly to DOM */
  const growHeightRef = useRef(0);
  /** Tracks which items have already "exploded" (one-shot glow pulse) */
  const explodedRef = useRef(new Set<string>());
  /** Ref to the line wrapper div for direct DOM height manipulation */
  const lineWrapperRef = useRef<HTMLDivElement>(null);
  /** Ref to the SVG element for direct DOM attribute updates */
  const svgRef = useRef<SVGSVGElement>(null);
  /** Timestamp of the last growth RAF tick for dt calculation */
  const lastGrowthTimeRef = useRef(0);
  /** Unique ID for SVG gradient/filter IDs (timeline line glow) */
  const uid = useId();

  // ── State ───────────────────────────────────
  const [contentHeight, setContentHeight] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [revealedItems, setRevealedItems] = useState(0);
  const [scrollStarted, setScrollStarted] = useState(false);
  /** Tracks the actual track DOM element for ResizeObserver re-attachment.
   *  When items go through an empty phase, the track div is destroyed and
   *  re-created. Without this state, the ResizeObserver effect (which runs
   *  once on mount) stays attached to the removed element and contentHeight
   *  gets stuck at 0, preventing the RAF scroll from starting. */
  const [trackElement, setTrackElement] = useState<HTMLDivElement | null>(null);
  /** Tick counter incremented after MIN_MONTH_DISPLAY_MS to force checkMonthEnd
   *  to re-evaluate even when no other deps change. Without this, a month with
   *  few items reveals them all immediately but checkMonthEnd only runs ONCE
   *  (when revealedItems reaches totalItems) — at that point the min display
   *  time hasn't elapsed, so isMonthExhausted returns false and onMonthEnd
   *  NEVER fires, leaving the month stuck forever. */
  const [monthCheckTick, setMonthCheckTick] = useState(0);
  /** Key of the currently focused record for the glassmorphism card overlay */
  const [focusItemKey, setFocusItemKey] = useState<string | null>(null);
  /** When true, the focus card plays its exit animation */
  const [isCardExiting, setIsCardExiting] = useState(false);
  /** Position of the contextual focus card relative to the viewport container */
  const [cardPosition, setCardPosition] = useState<{ top: number; left: number } | null>(null);


  // Reset all state when items/month changes
  // NOTE: itemsGenerationRef is incremented so checkMonthEnd can detect stale
  // revealedItems and skip evaluation until the state has been flushed to 0.
  useEffect(() => {
    setRevealedItems(0);
    setScrollStarted(false);
    currentPosRef.current = 0;
    monthEndFiredRef.current = false;
    isPausedRef.current = false;
    monthStartTimeRef.current = Date.now(); // Fix B: reset month display timer
    if (trackRef.current) {
      trackRef.current.style.transform = 'translateY(0px)';
    }
    // Reset growth + explosion + focus card state
    // growHeight starts at SVG_TOP_OFFSET so the glow line always connects to the header divider
    growHeightRef.current = SVG_TOP_OFFSET;
    explodedRef.current.clear();
    setFocusItemKey(null);
    setIsCardExiting(false);
    if (lineWrapperRef.current) {
      lineWrapperRef.current.style.height = `${SVG_TOP_OFFSET}px`;
    }
    itemsGenerationRef.current += 1;
  }, [items, month, yearProp]);

  const animateSlides = !reducedMotion;
  const totalItems = items.length;

  // ── Immediate first-item reveal ─────────────
  // When the timeline starts, reveal the first item right away
  // so the user sees content immediately, not a blank screen.
  useEffect(() => {
    if (!animateSlides || totalItems === 0 || transitioning || !isInView) return;
    if (revealedItems > 0) return;
    setRevealedItems(1);
  }, [animateSlides, isInView, totalItems, transitioning, revealedItems]);

  // ── Reduced motion detection ────────────────
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ── IntersectionObserver ────────────────────
  useEffect(() => {
    if (!viewportRef.current) return;
    const el = viewportRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── ResizeObserver for content height ───────
  // Re-attaches when trackElement changes (e.g., after empty phase → items arrive).
  useEffect(() => {
    if (!trackElement) return;
    const observer = new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height;
      contentHeightRef.current = h;
      setContentHeight(h);
    });
    observer.observe(trackElement);
    return () => observer.disconnect();
  }, [trackElement]);

  // ── Reveal all instantly when reduced motion ──
  useEffect(() => {
    if (reducedMotion && totalItems > 0) {
      setRevealedItems(totalItems);
    }
  }, [reducedMotion, totalItems]);

  // ── Track when the last item was revealed ──
  useEffect(() => {
    if (revealedItems === totalItems && totalItems > 0) {
      lastRevealTimeRef.current = Date.now();
    }
  }, [revealedItems, totalItems]);

  // ── Continuous growth RAF loop ──────────────
  // Grows the line at PX_PER_SECOND. Processes items in explosion order
  // (using explodedRef.current.size, NOT revealedItems). When growth
  // reaches an item, dot explodes, focus card appears (if renderFocusCard
  // is provided), and the loop STOPS until handleFocusCardDismiss
  // increments revealedItems, which re-triggers this effect.
  //
  // Using explodedRef.current.size as the processing index ensures the
  // first item (index 0) is always processed, even when revealedItems
  // starts at 1 (immediate-first-item reveal).
  useEffect(() => {
    if (!animateSlides || totalItems === 0 || !isInView || transitioning) return;
    if (explodedRef.current.size >= totalItems) return; // All items exploded

    let running = true;
    lastGrowthTimeRef.current = 0;

    function tick(now: number) {
      if (!running) return;

      // First tick: initialize timestamp, skip growth
      if (lastGrowthTimeRef.current === 0) {
        lastGrowthTimeRef.current = now;
        requestAnimationFrame(tick);
        return;
      }

      const dt = (now - lastGrowthTimeRef.current) / 1000;
      lastGrowthTimeRef.current = now;

      // Grow the line
      growHeightRef.current += PX_PER_SECOND * dt;

      // Apply height to wrapper DOM directly (no re-render)
      if (lineWrapperRef.current) {
        lineWrapperRef.current.style.height = `${growHeightRef.current}px`;
      }

      // Update SVG height and coordinates via DOM (no re-render)
      if (svgRef.current) {
        const h = growHeightRef.current;
        svgRef.current.setAttribute('height', String(h));
        const lines = svgRef.current.querySelectorAll('line');
        lines.forEach((line) => line.setAttribute('y2', String(h)));
        const circles = svgRef.current.querySelectorAll('circle');
        circles.forEach((circle) => circle.setAttribute('cy', String(h)));
      }

      // Process the next un-exploded item (by exploded count, not revealedItems)
      if (!itemsContainerRef.current) {
        requestAnimationFrame(tick);
        return;
      }

      const container = itemsContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const allItems = container.querySelectorAll('[data-item-key]');

      const processedCount = explodedRef.current.size;

      // Safety: if all items are processed, keep growing
      if (processedCount >= allItems.length) {
        requestAnimationFrame(tick);
        return;
      }

      const targetEl = allItems[processedCount] as HTMLElement;
      const key = targetEl.getAttribute('data-item-key') || '';

      // Already exploded (shouldn't happen if loop stops, but safety)
      if (explodedRef.current.has(key)) {
        requestAnimationFrame(tick);
        return;
      }

      const rect = targetEl.getBoundingClientRect();
      const itemCenter = (rect.top + rect.bottom) / 2 - containerRect.top;

      // Growth hasn't reached the item yet — keep growing
      // SVG starts SVG_TOP_OFFSET px above the items container to connect with the header divider
      if (growHeightRef.current < itemCenter + SVG_TOP_OFFSET) {
        requestAnimationFrame(tick);
        return;
      }

      // ── ITEM REACHED! ──
      explodedRef.current.add(key);

      // Apply explosion class directly to DOM (no re-render from revealedItems)
      targetEl.querySelector('.auto-dot-glow')?.classList.add('dot-exploded');

      if (renderFocusCard) {
        // Card mode: show focus card and STOP the loop.
        // Will restart when revealedItems changes (card dismissed via handleFocusCardDismiss).
        setFocusItemKey(key);
      } else {
        // No-card mode: auto-reveal the item and continue the loop.
        // setRevealedItems triggers a re-render, effect restarts, processes the next item.
        setRevealedItems((prev) => prev + 1);
      }
    }

    requestAnimationFrame(tick);
    return () => {
      running = false;
    };
  }, [animateSlides, isInView, totalItems, transitioning, revealedItems, renderFocusCard]);

  // ── Scroll start trigger (viewport-full) ────
  useEffect(() => {
    if (!animateSlides || scrollStarted) return;
    if (isViewportFull(revealedItems, ITEMS_BEFORE_SCROLL)) {
      setScrollStarted(true);
    }
  }, [animateSlides, revealedItems, scrollStarted]);

  // ── Deferred month check — ticks after MIN_MONTH_DISPLAY_MS to force
  //    checkMonthEnd to re-evaluate when the min display time elapses ──
  useEffect(() => {
    if (totalItems === 0 || revealedItems < totalItems) return;
    if (monthEndFiredRef.current) return;
    const timeout = setTimeout(() => setMonthCheckTick((p) => p + 1), MIN_MONTH_DISPLAY_MS);
    return () => clearTimeout(timeout);
  }, [revealedItems, totalItems]);

  // ── Reset exit state cuando aparece un nuevo focus item ──
  // La salida del card la dispara BeamSvg via onCycleComplete
  useEffect(() => {
    if (!focusItemKey) return;
    setIsCardExiting(false);
  }, [focusItemKey]);

  // ── Focus card position: anchored to the exploded item ──
  useEffect(() => {
    if (!focusItemKey || !viewportRef.current) {
      setCardPosition(null);
      return;
    }

    const viewport = viewportRef.current;
    const viewportRect = viewport.getBoundingClientRect();
    const itemEl = viewport.querySelector(`[data-item-key="${focusItemKey}"]`) as HTMLElement | null;
    if (!itemEl) return;

    const itemRect = itemEl.getBoundingClientRect();
    const itemTopRel = itemRect.top - viewportRect.top;
    const itemBottomRel = itemRect.bottom - viewportRect.top;

    const gap = 4;
    const estimatedCardHeight = 180;
    const margin = 16;
    let cardTop: number;

    // Prefer below the item, but move above if not enough space at bottom
    if (itemBottomRel + gap + estimatedCardHeight > viewportRect.height - margin) {
      cardTop = Math.max(margin, itemTopRel - estimatedCardHeight - gap);
    } else {
      cardTop = itemBottomRel + gap;
    }

    // Alinear connector dot del card (cx=3) con el dot del timeline
    const dotAnchor = itemEl.querySelector('[data-dot-anchor="true"]') as HTMLElement | null;
    let cardLeft = 16; // fallback
    if (dotAnchor) {
      const dotRect = dotAnchor.getBoundingClientRect();
      const dotCenterX = dotRect.left + dotRect.width / 2 - viewportRect.left;
      cardLeft = dotCenterX - 3; // 3 = connector dot cx en BeamSvg
    }

    setCardPosition({ top: Math.round(cardTop), left: Math.round(cardLeft) });
  }, [focusItemKey]);

  // ── Handle focus card dismiss after exit animation ──
  const handleFocusCardDismiss = useCallback(() => {
    setFocusItemKey(null);
    setIsCardExiting(false);
    // Reveal the item in the timeline now that the card is gone
    setRevealedItems((prev) => prev + 1);
  }, []);

  // ── checkMonthEnd — fires onMonthEnd when exhausted ──
  useEffect(() => {
    if (!animateSlides || !onMonthEnd || !viewportRef.current || !itemsContainerRef.current) return;
    if (transitioning) return; // Don't check during transition
    if (monthEndFiredRef.current) return; // Already fired for this month

    // GENERATION GUARD: prevent stale revealedItems closure from triggering
    // premature month exhaustion when items/month/year change.
    // The reset effect increments itemsGenerationRef and calls setRevealedItems(0),
    // but the state update is async — this effect's captured revealedItems may
    // still hold the OLD value (e.g., 6 from May) while items already reflect
    // the NEW month (e.g., 4 items for April). Without this guard,
    // revealedItems (6) >= totalItems (4) would fire onMonthEnd prematurely.
    //
    // We only mark a generation as "checked" after revealedItems has been
    // flushed to 0 AND this effect has re-run with that fresh value.
    const gen = itemsGenerationRef.current;
    if (checkedGenerationRef.current !== gen) {
      // First run for this generation — wait until revealedItems has been flushed
      if (revealedItems === 0) {
        checkedGenerationRef.current = gen;
      }
      return;
    }

    // Must have all items revealed
    if (revealedItems < totalItems) return;

    // Find the last revealed item
    const container = itemsContainerRef.current;
    const revealedEls = container.querySelectorAll('[data-revealed="true"]') as NodeListOf<HTMLElement>;
    if (revealedEls.length === 0) return;
    const lastItem = revealedEls[revealedEls.length - 1];
    const lastRect = lastItem.getBoundingClientRect();
    const viewportRect = viewportRef.current.getBoundingClientRect();

    // Give the last item's CSS animation (~600ms) time to complete before
    // allowing exhaustion. Without this, months with many items where the
    // scroll has already pushed the last item past the viewport can transition
    // before the last item's reveal animation finishes.
    if (Date.now() - lastRevealTimeRef.current < 1200) return;

    if (isMonthExhausted(revealedItems, totalItems, lastRect.bottom, viewportRect.bottom, monthStartTimeRef.current)) {
      monthEndFiredRef.current = true;
      onMonthEnd();
    }
  }, [animateSlides, revealedItems, totalItems, onMonthEnd, transitioning, monthCheckTick]);

  // ── RAF continuous scroll loop ──────────────
  useEffect(() => {
    if (!animateSlides || !isInView || contentHeight === 0 || !scrollStarted) return;

    lastTimeRef.current = performance.now();

    function tick(now: number) {
      if (isPausedRef.current) {
        lastTimeRef.current = now;
      } else if (trackRef.current && contentHeightRef.current > 0) {
        const dt = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        // Cap max scroll to content height
        const maxPos = Math.max(0, contentHeightRef.current - (YEAR_HEADER_H * 2));
        currentPosRef.current = Math.min(
          currentPosRef.current + PX_PER_SECOND * dt,
          maxPos,
        );

        trackRef.current.style.transform = `translateY(-${currentPosRef.current}px)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animateSlides, isInView, contentHeight, scrollStarted]);

  // ── Wheel interceptor ───────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (trackRef.current) {
      currentPosRef.current = Math.max(0, currentPosRef.current + e.deltaY);
      trackRef.current.style.transform = `translateY(-${currentPosRef.current}px)`;
    }
    isPausedRef.current = true;
    clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, 2000);
  }, []);

  // ── Touch interceptor ───────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = touchStartYRef.current - e.touches[0].clientY;
    touchStartYRef.current = e.touches[0].clientY;
    if (trackRef.current) {
      currentPosRef.current = Math.max(0, currentPosRef.current + delta);
      trackRef.current.style.transform = `translateY(-${currentPosRef.current}px)`;
    }
    isPausedRef.current = true;
    clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, 2000);
  }, []);

  // ── Cleanup on unmount ──────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(resumeTimeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Always render the viewport container so the IntersectionObserver ref stays attached.
  // Content is conditionally rendered based on items.length and transitioning state.
  const viewportHeight = ITEM_HEIGHT * VISIBLE_ITEMS;
  // Fallback: if contentHeight is too small to fit even the header + a single item,
  // the ResizeObserver likely hasn't measured the final layout yet.
  // Viewport always uses the full viewport height so users can scroll to see
  // items beyond the first few. contentHeight is only used for the scroll max
  // position in the RAF loop, NOT for the viewport size.
  // A smaller viewport would clip items without overflow space to scroll into.
  // Empty state: show header + optional transition placeholder, but keep the container alive
  if (items.length === 0) {
    return (
      <div
        ref={viewportRef}
        className="relative overflow-hidden"
        style={{ height: viewportHeight, touchAction: 'none' }}>
        <div className="absolute top-0 left-0 right-0 z-20 pl-9 pt-2 pb-1 bg-secondary-50 dark:bg-secondary-900 overflow-hidden">
          <div className="relative h-4">
            <span
              key={`month-label-${yearProp}-${month}`}
              className={`absolute inset-0 flex items-center text-xs font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest select-none${
                transitioning ? ' month-label-exit' : ' month-label-enter'
              }`}
            >
              {monthName.toUpperCase()} · {yearProp}
            </span>
          </div>
          <div className="h-px bg-secondary-200 dark:bg-secondary-700 mt-1" style={{ marginLeft: -12 }} />
        </div>
        {transitioning && (
          <div className="will-change-transform timeline-fade-out" style={{ paddingTop: YEAR_HEADER_H }}>
            <div className="relative">
              <div className="absolute left-[24px] top-0 w-[1.5px] bg-secondary-200 dark:bg-secondary-700 pointer-events-none"
                   style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS - YEAR_HEADER_H }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Render month items ──────────────────────
  return (
    <div
      ref={viewportRef}
      className="relative overflow-hidden will-change-transform"
      style={{ height: viewportHeight, touchAction: 'none' }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* ── Fixed header ── */}
      <div className="absolute top-0 left-0 right-0 z-20 pl-9 pt-2 pb-1 bg-secondary-50 dark:bg-secondary-900 overflow-hidden">
        <div className="relative h-4">
          <span
            key={`month-label-${yearProp}-${month}`}
            className={`absolute inset-0 flex items-center text-xs font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-widest select-none${
              transitioning ? ' month-label-exit' : ' month-label-enter'
            }`}
          >
            {monthName.toUpperCase()} · {yearProp}
          </span>
        </div>
        <div className="h-px bg-secondary-200 dark:bg-secondary-700 mt-1" style={{ marginLeft: -12 }} />
      </div>

      {/* ── Scrollable track ── */}
      <div
        ref={(node) => {
          trackRef.current = node;
          setTrackElement(node);
        }}
        className={`will-change-transform${transitioning ? ' timeline-fade-out' : ''}`}
        style={{ paddingTop: YEAR_HEADER_H }}
      >
        <div ref={itemsContainerRef} className="relative">
          {/* SVG glow line — base line + tip beam + glow head, inside items, scrolls WITH content */}
          <div
            ref={lineWrapperRef}
            className="absolute left-[18px] pointer-events-none"
            style={{ width: 12, overflow: 'hidden', top: -SVG_TOP_OFFSET, height: SVG_TOP_OFFSET }}
          >
            <svg ref={svgRef} width="12" height={SVG_TOP_OFFSET} aria-hidden="true">
                <defs>
                  {/* Gradiente del haz de luz en la punta — solo visible en el último ~25% */}
                  <linearGradient id={`tip-beam-${uid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"    stopColor="rgba(96,165,250,0)" />
                    <stop offset="70%"   stopColor="rgba(96,165,250,0)" />
                    <stop offset="85%"   stopColor="rgba(96,165,250,0.08)" />
                    <stop offset="95%"   stopColor="rgba(96,165,250,0.30)" />
                    <stop offset="100%"  stopColor="rgba(96,165,250,0.55)" />
                  </linearGradient>
                  {/* Filtros de blur */}
                  <filter id={`blur-beam-${uid}`}>
                    <feGaussianBlur stdDeviation="3" />
                  </filter>
                  <filter id={`blur-head-${uid}`}>
                    <feGaussianBlur stdDeviation="4" />
                  </filter>
                </defs>

                {/* Capa 1: Línea base delgada — RAF updates y2 per frame */}
                <line
                  x1="6" y1="0" x2="6" y2={SVG_TOP_OFFSET}
                  stroke="rgba(148,163,184,0.4)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Capa 2: Haz de luz en la punta — RAF updates y2 per frame */}
                <line
                  x1="6" y1="0" x2="6" y2={SVG_TOP_OFFSET}
                  stroke={`url(#tip-beam-${uid})`}
                  strokeWidth="8"
                  strokeLinecap="round"
                  filter={`url(#blur-beam-${uid})`}
                />

                {/* Capa 3: Halo exterior del glow head — RAF updates cy per frame */}
                <circle cx="6" cy={SVG_TOP_OFFSET} r="10"
                        fill="rgba(96,165,250,0.12)"
                        filter={`url(#blur-head-${uid})`} />

                {/* Capa 4: Halo interior del glow head — RAF updates cy per frame */}
                <circle cx="6" cy={SVG_TOP_OFFSET} r="5"
                        fill="rgba(96,165,250,0.35)"
                        filter={`url(#blur-head-${uid})`} />

                {/* Capa 5: Núcleo brillante del head — RAF updates cy per frame */}
                <circle cx="6" cy={SVG_TOP_OFFSET} r="1.5"
                        fill="rgba(148,163,184,0.9)" />
              </svg>
            </div>

          <div className="space-y-0">
            {items.map((item, itemIdx) => {
              const dotColor = getStatusDot?.(item) || 'bg-secondary-300 dark:bg-secondary-600';
              const day = new Date(getDate(item)).getDate();
              const isRevealed = !animateSlides || itemIdx < revealedItems;
              const isItemExploded = explodedRef.current.has(getKey(item));

              return (
                <div
                  key={getKey(item)}
                  data-revealed={animateSlides && isRevealed ? 'true' : undefined}
                  data-item-key={animateSlides ? getKey(item) : undefined}
                  className={`relative pl-9 py-2.5 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors${
                    animateSlides ? ' auto-slide' : ''
                  }${isRevealed ? ' active' : ''}`}
                >
                  {/* Dot */}
                  <div
                    data-dot-anchor="true"
                    className={`absolute left-[17px] top-1/2 -translate-y-1/2 z-10 pointer-events-none transition-all duration-300${
                    isRevealed || isItemExploded ? ' opacity-100 scale-100' : ' opacity-0 scale-0'
                  }`}>
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-white dark:bg-secondary-900 flex items-center justify-center${
                        animateSlides ? ' auto-dot' : ''
                      }`}
                    >
                      <div
                        className={`absolute w-3 h-3 rounded-full ${dotColor} opacity-60 blur-[3px]${
                          animateSlides ? ' auto-dot-glow' : ''
                        }${isItemExploded ? ' dot-exploded' : ''}`}
                      />
                      <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    </div>
                  </div>

                  {/* Horizontal dot-to-day line */}
                  {animateSlides && (
                    <div
                      className={`absolute left-[20px] top-1/2 -translate-y-1/2 w-[13px] h-px bg-secondary-300 dark:bg-secondary-600 transition-opacity duration-300 ${
                        isRevealed ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{ transitionDelay: isRevealed ? '0.12s' : '0s' }}
                    />
                  )}

                  {/* Day + Content + Value */}
                  <div className="flex items-center gap-2">
                    {/* Day */}
                    <span
                      className={`text-base font-semibold text-secondary-600 dark:text-secondary-400 w-5 text-right flex-shrink-0 tabular-nums leading-none${
                        animateSlides ? ' auto-day' : ''
                      }${!isRevealed ? ' opacity-0' : ''}`}
                    >
                      {day}
                    </span>

                    {/* Details + pocket */}
                    <div
                      className={`flex-1 min-w-0${animateSlides ? ' auto-detail' : ''}${!isRevealed ? ' opacity-0' : ''}`}
                    >
                      {renderRow(item, itemIdx)}
                      {renderPocket && (
                        <div className="text-[11px] text-secondary-400 dark:text-secondary-500 italic leading-tight mt-0.5">
                          {renderPocket(item)}
                        </div>
                      )}
                    </div>

                    {/* Value/amount */}
                    {animateSlides && renderValue && (
                      <div className={`auto-value shrink-0${!isRevealed ? ' opacity-0' : ''}`}>
                        {renderValue(item)}
                      </div>
                    )}
                    {!animateSlides && renderValue && (
                      <div className={`shrink-0 text-secondary-600 dark:text-secondary-400${!isRevealed ? ' opacity-0' : ''}`}>
                        {renderValue(item)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Viewport blur overlay — fade in/out sincronizado con la card ── */}
      {focusItemKey && (
        <div className={`absolute inset-0 z-[21] pointer-events-none ${
          isCardExiting ? 'focus-overlay-exit' : 'focus-overlay-enter'
        }`} />
      )}

      {/* ── RecordFocusCard overlay — contextual, anclado al item explotado ── */}
      {renderFocusCard && focusItemKey && cardPosition && items.find((item) => getKey(item) === focusItemKey) && (
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            top: cardPosition.top,
            left: cardPosition.left,
            maxWidth: 380,
            width: `calc(100% - ${cardPosition.left + 16}px)`,
          }}
        >
          <div className="relative" key={focusItemKey}>
            {/* Corriente SVG — stroke-dashoffset animado sobre un solo rect */}
            <div className="focus-card-glow">
              <BeamSvg
                accentRgb={accentRgb || '96,165,250'}
                onCycleComplete={() => setIsCardExiting(true)}
              />
            </div>
            <RecordFocusCard
              item={items.find((item) => getKey(item) === focusItemKey)!}
              renderDetail={renderFocusCard}
              isExiting={isCardExiting}
              onDismiss={handleFocusCardDismiss}
              monthName={monthName}
              year={yearProp}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(TimelineFeed) as typeof TimelineFeed;
