import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '../../core/utils/format';
import SessionFilters, { SessionFilterType } from './SessionFilters';
import './FloatingFilterToggle.css';

export interface FloatingFilterToggleProps {
  onFilterChange: (
    filter: SessionFilterType,
    dateRange?: { startDate: string; endDate: string },
    year?: number,
    month?: number
  ) => void;
  defaultFilter?: SessionFilterType;
  accentColor?: 'green' | 'red' | 'primary' | 'orange' | 'blue';
  statusFilter?: 'all' | 'active' | 'paid';
  onStatusFilterChange?: (status: 'all' | 'active' | 'paid') => void;
  /** Called quando el panel se abre o cierra — útil para ocultar FAB */
  onIsOpenChange?: (open: boolean) => void;
}

/* ── Accent color classes for the toggle button ── */
const accentBtnMap: Record<string, {
  base: string; hover: string; expanded: string; text: string; textDark: string;
}> = {
  green:  { base: 'border-green-300 dark:border-green-600', hover: 'hover:bg-green-50 dark:hover:bg-green-900/20', expanded: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600', textDark: 'dark:text-green-400' },
  orange: { base: 'border-orange-300 dark:border-orange-600', hover: 'hover:bg-orange-50 dark:hover:bg-orange-900/20', expanded: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600', textDark: 'dark:text-orange-400' },
  red:    { base: 'border-red-300 dark:border-red-600', hover: 'hover:bg-red-50 dark:hover:bg-red-900/20', expanded: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600', textDark: 'dark:text-red-400' },
  blue:   { base: 'border-blue-300 dark:border-blue-600', hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20', expanded: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600', textDark: 'dark:text-blue-400' },
  primary:{ base: 'border-primary-300 dark:border-primary-600', hover: 'hover:bg-primary-50 dark:hover:bg-primary-900/20', expanded: 'bg-primary-100 dark:bg-primary-900/30', text: 'text-primary-600', textDark: 'dark:text-primary-400' },
};

const FloatingFilterToggle: React.FC<FloatingFilterToggleProps> = ({
  onFilterChange,
  defaultFilter = 'all',
  accentColor = 'green',
  statusFilter,
  onStatusFilterChange,
  onIsOpenChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const a = accentBtnMap[accentColor] || accentBtnMap.green;

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    onIsOpenChange?.(next);
  };
  const close = useCallback(() => {
    setIsOpen(false);
    onIsOpenChange?.(false);
  }, [onIsOpenChange]);

  /* Cerrar con Escape y click fuera */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, close]);

  return (
    <>
      {/* ═══ Toggle button — siempre visible ═══ */}
      <button
        ref={btnRef}
        onClick={toggle}
        className={cn(
          'filter-toggle-btn fixed bottom-6 left-6 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-white/80 dark:bg-secondary-800/80 backdrop-blur-sm border-2 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-110 active:scale-95',
          a.base, a.text, a.textDark, a.hover
        )}
        aria-label="Filtros"
        aria-expanded={isOpen}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
      </button>

      {/* ═══ Desktop — popover panel sobre el botón ═══ */}
      {isOpen && (
        <div className="filter-popover fixed bottom-32 left-6 z-50 hidden md:block">
          <div ref={panelRef} className="bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-600 rounded-xl shadow-2xl py-3 px-4">
            <SessionFilters
              onFilterChange={onFilterChange}
              defaultFilter={defaultFilter}
              accentColor={accentColor}
              statusFilter={statusFilter}
              onStatusFilterChange={onStatusFilterChange}
              embedded
            />
          </div>
        </div>
      )}

      {/* ═══ Mobile — bottom sheet overlay ═══ */}
      {isOpen && (
        <div className="filter-mobile-overlay fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={close} />

          {/* Sheet */}
          <div
            ref={panelRef}
            className="filter-bottom-sheet absolute bottom-0 left-0 right-0 bg-white dark:bg-secondary-800 rounded-t-2xl shadow-2xl min-h-[30vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-secondary-300 dark:bg-secondary-600" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-2 border-b border-secondary-200 dark:border-secondary-700">
              <h2 className="text-base font-semibold text-secondary-900 dark:text-white">Filtros</h2>
              <button
                onClick={close}
                className="p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
              >
                <svg className="w-5 h-5 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filter controls */}
            <div className="px-5 py-4">
              <SessionFilters
                onFilterChange={onFilterChange}
                defaultFilter={defaultFilter}
                accentColor={accentColor}
                statusFilter={statusFilter}
                onStatusFilterChange={onStatusFilterChange}
                embedded
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingFilterToggle;
