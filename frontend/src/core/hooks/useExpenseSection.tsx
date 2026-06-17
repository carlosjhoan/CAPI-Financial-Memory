import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Expense, ExpenseFilters } from '../../features/expenses/types/expense.types';
import {
  useExpensesPaginated,
  useMonthlySummary,
  useYearlySummary,
  useOverallSummary,
} from '../../features/expenses/hooks/useExpenses';
import { getMonthName, getMonthNumber, formatDateMonthShort } from '../utils/format';
import { SessionFilterType } from '../../shared/components/SessionFilters';
import { useAutoCorrectPage } from '.';
import type { ViewMode, SummaryController, MonthlyBreakdownController, LayoutConfig, EntityFinancialSectionProps } from '../../shared/components/EntityFinancialSection';
import type { CardRenderConfig } from '../../shared/components/EntityFinancialSection';
import { deriveAvailableMonths } from '../utils/timeline';
import type { AvailableMonth } from '../utils/timeline';

const LIMIT = 6;
const TIMELINE_LIMIT = 50;

// Mapa de nombres de mes (inglés → español) para normalizar
// el monthlyBreakdown que viene del backend con nombres en inglés (Jan, Feb, etc.)
const EN_TO_ES_MONTH_MAP: Record<string, string> = {
  Jan: 'Enero', Feb: 'Febrero', Mar: 'Marzo', Apr: 'Abril',
  May: 'Mayo', Jun: 'Junio', Jul: 'Julio', Aug: 'Agosto',
  Sep: 'Septiembre', Oct: 'Octubre', Nov: 'Noviembre', Dec: 'Diciembre',
};

export interface UseExpenseSectionOptions {
  filters?: ExpenseFilters;
  filterType?: SessionFilterType;
  onCreate?: () => void;
  card: CardRenderConfig<Expense>;
  /** Opcional: sobrescribe layout config por defecto */
  layout?: Partial<LayoutConfig>;
  /** Handlers opcionales */
  onEdit?: (item: Expense) => void;
  onDelete?: (item: Expense) => void;
  onClick?: (item: Expense) => void;
}

export interface ExpenseSectionReturn {
  items: Expense[];
  paginationMeta: EntityFinancialSectionProps<Expense>['paginationMeta'];
  error: Error | null;
  viewMode: ViewMode;
  card: CardRenderConfig<Expense>;
  summary: SummaryController;
  monthlyBreakdown: MonthlyBreakdownController;
  onPageChange: (page: number) => void;
  onCreate?: () => void;
  layout: LayoutConfig;

  // Timeline navigation (timeline-buffer)
  timelineNavigation?: {
    availableMonths: AvailableMonth[];
    currentMonthIndex: number;
    currentMonth: AvailableMonth | null;
    goToNextMonth: () => void;
    transitioning: boolean;
    monthItems: Expense[];
  };
}

/**
 * Hook que prepara todas las props para EntityFinancialSection
 * en el contexto de la sección de Gastos.
 * Centraliza queries, paginación, selección de mes, etc.
 */
export function useExpenseSection({
  filters,
  filterType = 'all',
  onCreate,
  card,
  layout: layoutOverride,
}: UseExpenseSectionOptions): ExpenseSectionReturn {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(getMonthName(new Date().getMonth() + 1));
  const [selectedMonthPage, setSelectedMonthPage] = useState(1);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [filters]);
  useEffect(() => {
    if (!filters?.year) return;
    setSelectedMonthPage(1);
    // Si el año es el actual, preseleccionar el mes corriente
    if (filters.year === new Date().getFullYear()) {
      setSelectedMonth(getMonthName(new Date().getMonth() + 1));
    } else {
      setSelectedMonth(null);
    }
  }, [filters?.year]);

  // ═══════════════════════════════════════════
  // TIMELINE NAVIGATION (timeline-buffer)
  // ═══════════════════════════════════════════
  const [timelineMonthIdx, setTimelineMonthIdx] = useState(0);
  const [timelineYear, setTimelineYear] = useState<number>(filters?.year ?? new Date().getFullYear());
  const [timelineTransitioning, setTimelineTransitioning] = useState(false);
  const initialTimelineYearRef = useRef(timelineYear);
  // Reset initial year ref when filters.year changes externally
  useEffect(() => {
    if (filters?.year) {
      initialTimelineYearRef.current = filters.year;
      setTimelineYear(filters.year);
      setTimelineMonthIdx(0);
    }
  }, [filters?.year]);

  // Timeline yearly summary — separate from the main one to allow independent year navigation
  const { data: timelineYearlySummary } = useYearlySummary(timelineYear);

  // Derive available months from timeline yearly summary
  const availableMonths: AvailableMonth[] = useMemo(() => {
    if (!timelineYearlySummary?.monthlyBreakdown) return [];
    return deriveAvailableMonths(timelineYearlySummary.monthlyBreakdown, timelineYear);
  }, [timelineYearlySummary, timelineYear]);

  // Total exhaustion: when timelineYear has no data, reset to initial year
  useEffect(() => {
    if (availableMonths.length === 0 && timelineYearlySummary && timelineYear < initialTimelineYearRef.current) {
      setTimelineYear(initialTimelineYearRef.current);
      setTimelineMonthIdx(0);
    }
  }, [availableMonths, timelineYearlySummary, timelineYear]);

  // Current timeline month info
  const currentTimelineMonth = availableMonths[timelineMonthIdx] ?? null;

  // Timeline items query — fetch current month's items with limit=50
  const { data: timelineMonthData } = useExpensesPaginated(
    currentTimelineMonth
      ? { year: currentTimelineMonth.year, month: currentTimelineMonth.month + 1 }
      : undefined,
    1,
    TIMELINE_LIMIT,
  );
  const timelineMonthItems = timelineMonthData?.data ?? [];

  // Advance to next month when TimelineFeed calls onMonthEnd
  const goToNextMonth = useCallback(() => {
    if (timelineTransitioning) return; // Guard: prevent double-fire
    setTimelineTransitioning(true);

    setTimeout(() => {
      const nextIdx = timelineMonthIdx + 1;
      if (nextIdx >= availableMonths.length) {
        // Year boundary — try previous year
        const prevYear = timelineYear - 1;
        setTimelineYear(prevYear);
        setTimelineMonthIdx(0);
      } else {
        setTimelineMonthIdx(nextIdx);
      }
      setTimelineTransitioning(false);
    }, 400);
  }, [timelineTransitioning, timelineMonthIdx, availableMonths.length, timelineYear]);

  // Timeline navigation object exposed to page component
  const timelineNavigation = useMemo(() => ({
    availableMonths,
    currentMonthIndex: timelineMonthIdx,
    currentMonth: currentTimelineMonth,
    goToNextMonth,
    transitioning: timelineTransitioning,
    monthItems: timelineMonthItems,
  }), [availableMonths, timelineMonthIdx, currentTimelineMonth, goToNextMonth, timelineTransitioning, timelineMonthItems]);

  // Map filterType to ViewMode
  const viewMode: ViewMode = useMemo(() => {
    switch (filterType) {
      case 'monthly': return 'monthly';
      case 'yearly': return 'yearly';
      case 'dateRange': return 'dateRange';
      default: return 'all';
    }
  }, [filterType]);

  // Queries
  const { data: paginatedData, error } = useExpensesPaginated(filters, currentPage, LIMIT);
  const { data: monthlySummary } = useMonthlySummary(filters?.year, filters?.month);
  const { data: yearlySummary } = useYearlySummary(filters?.year);
  const { data: overallSummary } = useOverallSummary(
    viewMode === 'dateRange' ? filters?.startDate : undefined,
    viewMode === 'dateRange' ? filters?.endDate : undefined
  );

  // Separate query to get yearly record count (backend service doesn't return it,
  // but GET /expenses?year=Y with meta.total gives us the count)
  const { data: yearlyCountData } = useExpensesPaginated(
    filters?.year ? { year: filters.year } : undefined,
    1,
    1
  );
  const yearlyRecordCount = yearlyCountData?.meta.total ?? 0;

  // Selected month filters
  const selectedMonthFilters = useMemo(() => {
    if (!selectedMonth || !filters?.year) return undefined;
    const monthNum = getMonthNumber(selectedMonth);
    if (!monthNum) return undefined;
    return { year: filters.year, month: monthNum };
  }, [selectedMonth, filters?.year]);

  // Query for selected month expenses
  const { data: selectedMonthExpenses } = useExpensesPaginated(
    selectedMonth ? selectedMonthFilters : undefined,
    selectedMonthPage,
    LIMIT
  );

  // Summaries
  const summary: SummaryController = useMemo(() => ({
    monthly: monthlySummary ? {
      month: getMonthName(filters?.month ?? 1),
      year: filters?.year ?? new Date().getFullYear(),
      totalAmount: monthlySummary.totalAmount,
      count: monthlySummary.expenseCount,
    } : null,
    yearly: yearlySummary ? {
      year: filters?.year ?? new Date().getFullYear(),
      totalAmount: yearlySummary.totalAmount,
      count: yearlyRecordCount,
      // Normalizar claves del breakdown de inglés a español (Jan→Enero, Feb→Febrero...)
      // para que coincida con disabledMonths y selectedMonth en español
      monthlyBreakdown: Object.entries(yearlySummary.monthlyBreakdown).reduce(
        (acc, [key, value]) => {
          const spanishKey = EN_TO_ES_MONTH_MAP[key as keyof typeof EN_TO_ES_MONTH_MAP] || key;
          acc[spanishKey] = value;
          return acc;
        },
        {} as Record<string, number>
      ),
    } : null,
    overall: overallSummary ? {
      totalAmount: overallSummary.totalAmount,
      count: overallSummary.totalExpenses,
    } : null,
  }), [monthlySummary, yearlySummary, overallSummary, yearlyRecordCount, filters?.month, filters?.year]);

  // Monthly breakdown (yearly view)
  const monthlyBreakdown: MonthlyBreakdownController = useMemo(() => ({
    selectedMonth,
    onMonthSelect: (month: string | null) => {
      // Normalizar: si el mes viene del backend en inglés (Jan, Feb...),
      // convertirlo a español (Enero, Febrero...) para que getMonthNumber funcione
      const spanishMonth = month ? (EN_TO_ES_MONTH_MAP[month] || month) : null;
      setSelectedMonth(spanishMonth);
      setSelectedMonthPage(1);
    },
    selectedItems: selectedMonthExpenses?.data ?? [],
    selectedPagination: selectedMonthExpenses?.meta,
    onSelectedPageChange: setSelectedMonthPage,
  }), [selectedMonth, selectedMonthExpenses]);

  // Page change handler
  const onPageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Auto-correct page if it exceeds totalPages after delete/filter
  // Fixes: deleting last item on last page → empty page bug
  useAutoCorrectPage(paginatedData?.meta, currentPage, onPageChange);
  // Monthly breakdown auto-correct: deleting last item on last page of selected month
  useAutoCorrectPage(selectedMonthExpenses?.meta, selectedMonthPage, setSelectedMonthPage);

  // Dynamic title
  const dynamicTitle = useMemo(() => {
    if (viewMode === 'dateRange' && filters?.startDate && filters?.endDate) {
      const startFormatted = formatDateMonthShort(filters.startDate);
      const endFormatted = formatDateMonthShort(filters.endDate);
      return `Gastos registrados (Desde ${startFormatted} hasta ${endFormatted})`;
    }
    if (viewMode === 'monthly' && filters?.month && filters?.year) {
      return `Resumen de ${getMonthName(filters.month)} de ${filters.year}`;
    }
    if (viewMode === 'yearly' && filters?.year) {
      return `Resumen del año ${filters.year}`;
    }
    return '';
  }, [viewMode, filters?.month, filters?.year, filters?.startDate, filters?.endDate]);

  // Default layout for expenses
  const defaultLayout: LayoutConfig = {
    accentColor: 'orange',
    title: dynamicTitle,
    totalLabel: 'Total:',
    emptyMessage: 'No hay gastos',
    emptyActionLabel: 'Crear Primer Gasto',
    createButtonLabel: 'Nuevo',
    gridColumns: 3,
    sectionName: 'Gastos',
    emptyIcon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="12" width="32" height="28" rx="3" />
        <path d="M24 8v20" />
        <path d="M16 20l8 8 8-8" />
      </svg>
    ),
  };

  return {
    items: paginatedData?.data ?? [],
    paginationMeta: paginatedData?.meta,
    error: error as Error | null,
    viewMode,
    card,
    summary,
    monthlyBreakdown,
    onPageChange,
    onCreate,
    layout: layoutOverride ? { ...defaultLayout, ...layoutOverride } : defaultLayout,
    timelineNavigation,
  };
}
