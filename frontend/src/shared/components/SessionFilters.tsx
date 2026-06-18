import React, { useState, useCallback, useRef } from 'react';
import DatePicker from './DatePicker';
import { cn } from '../../core/utils/format';

export type SessionFilterType = 'all' | 'monthly' | 'yearly' | 'dateRange';

export interface SessionFiltersProps {
  onFilterChange: (
    filter: SessionFilterType,
    dateRange?: { startDate: string; endDate: string },
    year?: number,
    month?: number
  ) => void;
  defaultFilter?: SessionFilterType;
  accentColor?: 'green' | 'red' | 'primary' | 'orange' | 'blue';

  /** Status filter — only for Deudas/Préstamos */
  statusFilter?: 'all' | 'active' | 'paid';
  onStatusFilterChange?: (status: 'all' | 'active' | 'paid') => void;

  /** Start expanded by default */
  defaultExpanded?: boolean;

  /** Embedded mode: render controls without toggle button or sliding animation.
   *  Used by FloatingFilterToggle in popover/bottom sheet. */
  embedded?: boolean;
}

const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

const TIME_FILTERS: { value: SessionFilterType; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' },
  { value: 'dateRange', label: 'Rango' },
];

const STATUS_FILTERS = [
  { value: 'all' as const, label: 'Cualquiera' },
  { value: 'active' as const, label: 'Activas' },
  { value: 'paid' as const, label: 'Pagadas' },
];

const SessionFilters: React.FC<SessionFiltersProps> = ({
  onFilterChange,
  defaultFilter = 'all',
  accentColor = 'green',
  statusFilter,
  onStatusFilterChange,
  defaultExpanded = false,
  embedded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [filterType, setFilterType] = useState<SessionFilterType>(defaultFilter);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // ── Accent color classes ──
  const getAccent = () => {
    const map: Record<string, {
      border: string; bg: string; bgDark: string; text: string; textDark: string;
      activeBg: string; activeBgDark: string; activeText: string; activeTextDark: string;
      radioAccent: string; pillBorder: string;
    }> = {
      green: {
        border: 'border-green-400', bg: 'bg-green-50', bgDark: 'dark:bg-green-900/20',
        text: 'text-green-600', textDark: 'dark:text-green-400',
        activeBg: 'bg-green-600', activeBgDark: 'dark:bg-green-500',
        activeText: 'text-white', activeTextDark: 'dark:text-white',
        radioAccent: 'rgb(22, 163, 74)', pillBorder: 'border-green-300 dark:border-green-600',
      },
      red: {
        border: 'border-red-400', bg: 'bg-red-50', bgDark: 'dark:bg-red-900/20',
        text: 'text-red-600', textDark: 'dark:text-red-400',
        activeBg: 'bg-red-600', activeBgDark: 'dark:bg-red-500',
        activeText: 'text-white', activeTextDark: 'dark:text-white',
        radioAccent: 'rgb(220, 38, 38)', pillBorder: 'border-red-300 dark:border-red-600',
      },
      orange: {
        border: 'border-orange-400', bg: 'bg-orange-50', bgDark: 'dark:bg-orange-900/20',
        text: 'text-orange-600', textDark: 'dark:text-orange-400',
        activeBg: 'bg-orange-600', activeBgDark: 'dark:bg-orange-500',
        activeText: 'text-white', activeTextDark: 'dark:text-white',
        radioAccent: 'rgb(234, 88, 12)', pillBorder: 'border-orange-300 dark:border-orange-600',
      },
      blue: {
        border: 'border-blue-400', bg: 'bg-blue-50', bgDark: 'dark:bg-blue-900/20',
        text: 'text-blue-600', textDark: 'dark:text-blue-400',
        activeBg: 'bg-blue-600', activeBgDark: 'dark:bg-blue-500',
        activeText: 'text-white', activeTextDark: 'dark:text-white',
        radioAccent: 'rgb(37, 99, 235)', pillBorder: 'border-blue-300 dark:border-blue-600',
      },
      primary: {
        border: 'border-primary-400', bg: 'bg-primary-50', bgDark: 'dark:bg-primary-900/20',
        text: 'text-primary-600', textDark: 'dark:text-primary-400',
        activeBg: 'bg-primary-600', activeBgDark: 'dark:bg-primary-500',
        activeText: 'text-white', activeTextDark: 'dark:text-white',
        radioAccent: 'rgb(79, 70, 229)', pillBorder: 'border-primary-300 dark:border-primary-600',
      },
    };
    return map[accentColor] || map.primary;
  };

  const a = getAccent();

  // ── Handlers ──
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const debounce = <T extends (...args: unknown[]) => void>(fn: T, delay: number) => {
    return (...args: Parameters<T>) => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = setTimeout(() => fn(...args), delay);
    };
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedOnFilterChange = useCallback(
    debounce((type: SessionFilterType, start?: string, end?: string, y?: number, m?: number) => {
      if (type === 'dateRange' && start && end) {
        onFilterChange(type, { startDate: start, endDate: end });
      } else if (type === 'yearly' && y) {
        onFilterChange(type, undefined, y);
      } else if (type === 'monthly' && y && m) {
        onFilterChange(type, undefined, y, m);
      }
    }, 300),
    [onFilterChange]
  );

  const handleTimeFilterChange = (newType: SessionFilterType) => {
    setFilterType(newType);

    if (newType === 'all') {
      onFilterChange('all');
    } else if (newType === 'dateRange') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const start = firstDay.toISOString().split('T')[0];
      const end = lastDay.toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(end);
      debouncedOnFilterChange('dateRange', start, end);
    } else if (newType === 'yearly') {
      debouncedOnFilterChange(newType, undefined, undefined, year);
    } else if (newType === 'monthly') {
      debouncedOnFilterChange(newType, undefined, undefined, year, month);
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setStartDate(v);
    if (v && endDate) debouncedOnFilterChange('dateRange', v, endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setEndDate(v);
    if (startDate && v) debouncedOnFilterChange('dateRange', startDate, v);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = parseInt(e.target.value, 10);
    setYear(y);
    if (filterType === 'yearly') onFilterChange('yearly', undefined, y);
    else if (filterType === 'monthly') onFilterChange('monthly', undefined, y, month);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = parseInt(e.target.value, 10);
    setMonth(m);
    onFilterChange('monthly', undefined, year, m);
  };

  // ── Pill class helper ──
  const pillClass = (isActive: boolean, accent: ReturnType<typeof getAccent>) =>
    cn(
      'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer',
      isActive
        ? `${accent.activeBg} ${accent.activeBgDark} ${accent.activeText} ${accent.activeTextDark} border-transparent`
        : `${accent.text} ${accent.textDark} ${accent.pillBorder} bg-transparent hover:bg-secondary-50 dark:hover:bg-secondary-700`
    );

  // ── Separator ──
  const divider = () => (
    <div className="w-px h-6 bg-secondary-200 dark:bg-secondary-600 flex-shrink-0" />
  );

  /* ── Filter controls content (shared between inline and embedded) ── */
  const renderControls = () => (
    <>
      {/* ── Time filter pills ── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {TIME_FILTERS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleTimeFilterChange(opt.value)}
            className={pillClass(filterType === opt.value, a)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Conditional controls ── */}
      {filterType !== 'all' && (
        <>
          {divider()}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Year select (monthly + yearly) */}
            {(filterType === 'monthly' || filterType === 'yearly') && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-secondary-500 dark:text-secondary-400 font-medium flex-shrink-0">Año</span>
                <select
                  value={year}
                  onChange={handleYearChange}
                  className="px-2 py-1.5 rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {years.map((y) => (<option key={y} value={y}>{y}</option>))}
                </select>
              </div>
            )}

            {/* Month select (monthly only) */}
            {filterType === 'monthly' && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-secondary-500 dark:text-secondary-400 font-medium flex-shrink-0">Mes</span>
                <select
                  value={month}
                  onChange={handleMonthChange}
                  className="px-2 py-1.5 rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {MONTHS.map(({ value, label }) => (<option key={value} value={value}>{label}</option>))}
                </select>
              </div>
            )}

            {/* Date Range */}
            {filterType === 'dateRange' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-secondary-500 dark:text-secondary-400 font-medium flex-shrink-0">Desde</span>
                  <DatePicker value={startDate} onChange={handleStartDateChange} placeholder="Inicio" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-secondary-500 dark:text-secondary-400 font-medium flex-shrink-0">Hasta</span>
                  <DatePicker value={endDate} onChange={handleEndDateChange} placeholder="Fin" />
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ── Status filter — only for Deudas/Préstamos ── */}
      {onStatusFilterChange && statusFilter !== undefined && (
        <>
          {divider()}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-secondary-500 dark:text-secondary-400 flex-shrink-0">Estado:</span>
            {STATUS_FILTERS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onStatusFilterChange(opt.value)}
                className={pillClass(statusFilter === opt.value, {
                  ...a,
                  activeBg: statusFilter === opt.value && opt.value === 'active'
                    ? 'bg-red-600' : statusFilter === opt.value && opt.value === 'paid'
                    ? 'bg-green-600' : a.activeBg,
                  activeBgDark: statusFilter === opt.value && opt.value === 'active'
                    ? 'dark:bg-red-500' : statusFilter === opt.value && opt.value === 'paid'
                    ? 'dark:bg-green-500' : a.activeBgDark,
                  text: opt.value === 'paid'
                    ? 'text-green-600'
                    : statusFilter === opt.value && opt.value === 'active'
                      ? 'text-red-600' : a.text,
                  textDark: opt.value === 'paid'
                    ? 'dark:text-green-400'
                    : statusFilter === opt.value && opt.value === 'active'
                      ? 'dark:text-red-400' : a.textDark,
                  pillBorder: statusFilter !== opt.value && opt.value === 'active'
                    ? 'border-red-300 dark:border-red-600' : statusFilter !== opt.value && opt.value === 'paid'
                    ? 'border-green-300 dark:border-green-600' : a.pillBorder,
                } as ReturnType<typeof getAccent>)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );

  /* ── Embedded mode: controls without toggle or sliding wrapper ── */
  if (embedded) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {renderControls()}
      </div>
    );
  }

  /* ── Inline mode: toggle + sliding bar (original behavior) ── */
  return (
    <div className="flex items-stretch">
      {/* ═══ Toggle button ═══ */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 z-10',
          a.text, a.textDark, a.pillBorder,
          'hover:bg-secondary-50 dark:hover:bg-secondary-700',
          expanded && `${a.bg} ${a.bgDark}`
        )}
      >
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
      </button>

      {/* ═══ Sliding filter bar — horizontal slide ═══ */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxWidth: expanded ? 800 : 0 }}
      >
        <div className="flex items-center gap-2 pl-2 h-full whitespace-nowrap bg-white dark:bg-secondary-800 rounded-r-xl border border-l-0 border-secondary-200 dark:border-secondary-700 shadow-sm py-1.5 pr-3">
          {renderControls()}
        </div>
      </div>
    </div>
  );
};

export default SessionFilters;
