import React, { useState, useCallback, useRef } from 'react';

// ==========================================
// TYPES
// ==========================================

export interface SplitPanelLayoutProps {
  /** Left panel content (typically TimelineFeed) */
  left: React.ReactNode;
  /** Right panel content (typically RecordFocusCard or empty placeholder) */
  right: React.ReactNode;
  /** When true on mobile, show the bottom sheet */
  showRightOnMobile?: boolean;
  /** Called when mobile bottom sheet is dismissed */
  onMobileDismiss?: () => void;
}

// ==========================================
// COMPONENT
// ==========================================

const SplitPanelLayout: React.FC<SplitPanelLayoutProps> = ({
  left,
  right,
  showRightOnMobile = false,
  onMobileDismiss,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [sheetTranslate, setSheetTranslate] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // ── Touch handlers for bottom sheet swipe-dismiss ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientY - touchStart;
    if (delta > 0) setSheetTranslate(delta);
  }, [isDragging, touchStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (sheetTranslate > 100) {
      onMobileDismiss?.();
    }
    setSheetTranslate(0);
  }, [sheetTranslate, onMobileDismiss]);

  // ── Desktop/Tablet: split layout ──
  return (
    <>
      {/* Desktop/Tablet: side-by-side */}
      <div className="hidden lg:flex gap-0 h-full">
        {/* Left panel — timeline */}
        <div className="w-[40%] min-w-0 overflow-y-auto border-r border-secondary-200 dark:border-secondary-700">
          {left}
        </div>

        {/* Right panel — detail */}
        <div className="flex-1 min-w-0 overflow-y-auto bg-secondary-50/50 dark:bg-secondary-900/30">
          {right || (
            <div className="flex items-center justify-center h-full p-8">
              <p className="text-sm text-secondary-400 dark:text-secondary-500 text-center italic">
                Seleccioná un movimiento para ver detalle
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tablet portrait: stacked */}
      <div className="hidden md:block lg:hidden">
        {left}
        {showRightOnMobile && right && (
          <div className="mt-4 border-t border-secondary-200 dark:border-secondary-700 pt-4">
            {right}
          </div>
        )}
      </div>

      {/* Mobile: single column + bottom sheet */}
      <div className="block md:hidden">
        {left}

        {/* Bottom sheet overlay */}
        {showRightOnMobile && right && (
          <div className="fixed inset-0 z-40">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30 dark:bg-black/50"
              onClick={onMobileDismiss}
            />

            {/* Sheet */}
            <div
              ref={sheetRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-secondary-800 rounded-t-2xl shadow-xl transition-transform duration-300 ease-out"
              style={{
                height: '70vh',
                transform: `translateY(${sheetTranslate}px)`,
                touchAction: 'none',
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-secondary-300 dark:bg-secondary-600" />
              </div>

              {/* Content */}
              <div className="overflow-y-auto h-full px-4 pb-8">
                {right}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default React.memo(SplitPanelLayout);