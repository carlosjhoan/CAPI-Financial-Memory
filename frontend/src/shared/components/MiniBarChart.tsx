import React, { useRef, useCallback, useEffect, useState } from 'react';

interface DepositItem {
  amount: number;
  date: string;
}

interface MiniBarChartProps {
  deposits: DepositItem[];
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'ENE', '02': 'FEB', '03': 'MAR', '04': 'ABR',
  '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AGO',
  '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DIC',
};

const getChartLabel = (dateStr: string): string => {
  // Formato: día-MES-año (2 dígitos) ej: "07-MAY-26"
  const day = dateStr.substring(8, 10);
  const month = MONTH_LABELS[dateStr.substring(5, 7)] || dateStr.substring(5, 7);
  const year = dateStr.substring(2, 4);
  return `${day}-${month}-${year}`;
};

const MiniBarChart: React.FC<MiniBarChartProps> = ({ deposits }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // --- Drag-scroll state ---
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const wasScrolledRef = useRef(false);
  const isMouseDownRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isMouseDownRef.current = true;
    wasScrolledRef.current = false;
    isDraggingRef.current = true;
    dragStartXRef.current = e.pageX;
    scrollStartRef.current = containerRef.current?.scrollLeft ?? 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const delta = e.pageX - dragStartXRef.current;
      if (Math.abs(delta) > 5) {
        wasScrolledRef.current = true;
      }
      if (containerRef.current) {
        containerRef.current.scrollLeft = scrollStartRef.current - delta;
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseUp = useCallback(() => {
    isMouseDownRef.current = false;
  }, []);

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (wasScrolledRef.current) {
      e.stopPropagation();
      wasScrolledRef.current = false;
    }
  }, []);

  // Sort deposits oldest -> newest (left to right), take last 7
  const sortedDeposits = [...deposits]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7); // Últimos 7 (más recientes)

  const maxAmount = sortedDeposits.reduce((max, d) => Math.max(max, d.amount), 0);
  const hasScrollableContent = sortedDeposits.length > 4;

  // Scroll to the RIGHT end ONLY on initial mount (show newest deposits)
  useEffect(() => {
    if (initialScrollDone.current) return;
    const container = containerRef.current;
    if (container && sortedDeposits.length > 0) {
      requestAnimationFrame(() => {
        container.scrollLeft = container.scrollWidth;
        initialScrollDone.current = true;
      });
    }
  }, [sortedDeposits.length]);

  return (
    <>
      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
      <div className="w-full overflow-hidden select-none relative">
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleContainerClick}
          className="flex items-end gap-2 overflow-x-auto pb-2 hide-scrollbar"
      >
        {sortedDeposits.length === 0 ? (
          <div className="text-center text-xs text-secondary-400 w-full py-4">
            Sin movimientos
          </div>
        ) : (
          sortedDeposits.map((deposit, index) => {
            const barHeight = maxAmount > 0 ? (deposit.amount / maxAmount) * 44 : 0;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index}
                className="relative flex flex-col items-center flex-shrink-0"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Value at top - siempre presente pero invisible */}
                {maxAmount > 0 && (
                  <div className={`text-xs font-bold text-green-500 mb-0.5 whitespace-nowrap transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    +${deposit.amount.toLocaleString()}
                  </div>
                )}

                {/* Bar */}
                <div
                  className={`w-[44px] rounded-sm transition-all duration-300 ${isHovered ? 'bg-green-600 dark:bg-green-300' : 'bg-green-500 dark:bg-green-400'} hover:bg-green-600 dark:hover:bg-green-300`}
                  style={{ height: `${Math.max(barHeight, 4)}px` }}
                />

                {/* Date at bottom - siempre presente pero invisible */}
                <span className={`text-[10px] text-secondary-500 dark:text-secondary-400 mt-1 whitespace-nowrap transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                  {getChartLabel(deposit.date)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Right-edge gradient indicator */}
      {hasScrollableContent && (
        <div className="absolute right-0 top-0 bottom-2 w-10 pointer-events-none bg-gradient-to-l from-white via-white/90 to-transparent dark:from-secondary-800 dark:via-secondary-800/90" />
      )}
    </div>
    </>
  );
};

export default React.memo(MiniBarChart);
