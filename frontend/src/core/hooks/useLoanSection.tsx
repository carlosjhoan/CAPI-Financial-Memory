import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Loan, LoanFilters } from '../../features/loans/types/loan.types';
import {
  useLoansPaginated,
  useMonthlySummary,
  useYearlySummary,
  useOverallSummary,
} from '../../features/loans/hooks/useLoans';
import { getMonthName, getMonthNumber, formatDateMonthShort } from '../utils/format';
import type { SessionFilterType } from '../../shared/components/SessionFilters';
import { useAutoCorrectPage } from '.';
import type { ViewMode, SummaryController, MonthlyBreakdownController, LayoutConfig, EntityFinancialSectionProps } from '../../shared/components/EntityFinancialSection';
import type { CardRenderConfig } from '../../shared/components/EntityFinancialSection';
import { deriveAvailableMonths } from '../utils/timeline';
import type { AvailableMonth } from '../utils/timeline';

const LIMIT = 6;
const TIMELINE_LIMIT = 50;

// Mapa de nombres de mes (inglés → español) para normalizar
const EN_TO_ES_MONTH_MAP: Record<string, string> = {
  Jan: 'Enero', Feb: 'Febrero', Mar: 'Marzo', Apr: 'Abril',
  May: 'Mayo', Jun: 'Junio', Jul: 'Julio', Aug: 'Agosto',
  Sep: 'Septiembre', Oct: 'Octubre', Nov: 'Noviembre', Dec: 'Diciembre',
};

export interface UseLoanSectionOptions {
  filters?: LoanFilters;
  filterType?: SessionFilterType;
  onCreate?: () => void;
  card: CardRenderConfig<Loan>;
  /** Opcional: sobrescribe layout config por defecto */
  layout?: Partial<LayoutConfig>;
  /** Handlers opcionales */
  onEdit?: (item: Loan) => void;
  onDelete?: (item: Loan) => void;
  onClick?: (item: Loan) => void;
}

export interface LoanSectionReturn {
  items: Loan[];
  paginationMeta: EntityFinancialSectionProps<Loan>['paginationMeta'];
  error: Error | null;
  viewMode: ViewMode;
  card: CardRenderConfig<Loan>;
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
    monthItems: Loan[];
  };
}

/**
 * Hook que prepara todas las props para EntityFinancialSection
 * en el contexto de la sección de Préstamos.
 * Centraliza queries, paginación, selección de mes, etc.
 */
export function useLoanSection({
  filters,
  filterType = 'all',
  onCreate,
  card,
  layout: layoutOverride,
}: UseLoanSectionOptions): LoanSectionReturn {
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
  const { data: timelineMonthData } = useLoansPaginated(
    currentTimelineMonth
      ? { year: currentTimelineMonth.year, month: currentTimelineMonth.month + 1 }
      : undefined,
    1,
    TIMELINE_LIMIT,
  );
  const timelineMonthItems = useMemo(() => timelineMonthData?.data ?? [], [timelineMonthData]);

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

  // Queries — status viene en filters desde el page
  const { data: paginatedData, error } = useLoansPaginated(
    filters,
    currentPage, 
    LIMIT
  );
  const { data: monthlySummary } = useMonthlySummary(filters?.year, filters?.month);
  const { data: yearlySummary } = useYearlySummary(filters?.year);
  const { data: overallSummary } = useOverallSummary(
    viewMode === 'dateRange' ? filters?.startDate : undefined,
    viewMode === 'dateRange' ? filters?.endDate : undefined
  );

  // Separate query to get yearly record count
  const { data: yearlyCountData } = useLoansPaginated(
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

  // Query for selected month loans
  const { data: selectedMonthLoans } = useLoansPaginated(
    selectedMonth ? selectedMonthFilters : undefined,
    selectedMonthPage,
    LIMIT
  );

  // Build summary for EntityFinancialSection
  const summary: SummaryController = useMemo(() => {
    // Para vista 'all', usar overallSummary
    if (viewMode === 'all') {
      if (overallSummary) {
        return {
          overall: {
            totalAmount: overallSummary.totalPending,
            count: overallSummary.totalLoans,
            activeCount: overallSummary.activeLoansCount,
            paidCount: overallSummary.fullyPaidCount,
          },
        };
      }
      return {};
    }

    return {
      monthly: monthlySummary ? {
        month: getMonthName(filters?.month ?? 1),
        year: filters?.year ?? new Date().getFullYear(),
        totalAmount: monthlySummary.totalAmountLent,
        count: monthlySummary.loanCount,
        activeCount: monthlySummary.activeCount,
        paidCount: monthlySummary.fullyPaidCount,
      } : null,
      yearly: yearlySummary ? {
        year: filters?.year ?? new Date().getFullYear(),
        totalAmount: yearlySummary.totalAmountLent,
        count: yearlyRecordCount,
        activeCount: yearlySummary.activeCount,
        paidCount: yearlySummary.fullyPaidCount,
        monthlyBreakdown: Object.entries(yearlySummary.monthlyBreakdown || {}).reduce(
          (acc, [key, value]) => {
            const spanishKey = EN_TO_ES_MONTH_MAP[key as keyof typeof EN_TO_ES_MONTH_MAP] || key;
            acc[spanishKey] = value;
            return acc;
          },
          {} as Record<string, number>
        ),
      } : null,
      overall: overallSummary ? {
        totalAmount: overallSummary.totalPending,
        count: overallSummary.totalLoans,
        activeCount: overallSummary.activeLoansCount,
        paidCount: overallSummary.fullyPaidCount,
      } : null,
    };
  }, [monthlySummary, yearlySummary, overallSummary, yearlyRecordCount, filters?.month, filters?.year, viewMode]);

  // Monthly breakdown (yearly view)
  const monthlyBreakdown: MonthlyBreakdownController = useMemo(() => ({
    selectedMonth,
    onMonthSelect: (month: string | null) => {
      const spanishMonth = month ? (EN_TO_ES_MONTH_MAP[month] || month) : null;
      setSelectedMonth(spanishMonth);
      setSelectedMonthPage(1);
    },
    selectedItems: selectedMonthLoans?.data ?? [],
    selectedPagination: selectedMonthLoans?.meta,
    onSelectedPageChange: setSelectedMonthPage,
  }), [selectedMonth, selectedMonthLoans]);

  // Page change handler
  const onPageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Auto-correct page if it exceeds totalPages after delete/filter
  useAutoCorrectPage(paginatedData?.meta, currentPage, onPageChange);
  // Monthly breakdown auto-correct: deleting last item on last page of selected month
  useAutoCorrectPage(selectedMonthLoans?.meta, selectedMonthPage, setSelectedMonthPage);

  // Dynamic title
  const dynamicTitle = useMemo(() => {
    if (viewMode === 'dateRange' && filters?.startDate && filters?.endDate) {
      const startFormatted = formatDateMonthShort(filters.startDate);
      const endFormatted = formatDateMonthShort(filters.endDate);
      return `Préstamos registrados (Desde ${startFormatted} hasta ${endFormatted})`;
    }
    if (viewMode === 'monthly' && filters?.month && filters?.year) {
      return `Resumen de ${getMonthName(filters.month)} de ${filters.year}`;
    }
    if (viewMode === 'yearly' && filters?.year) {
      return `Resumen del año ${filters.year}`;
    }
    return '';
  }, [viewMode, filters?.month, filters?.year, filters?.startDate, filters?.endDate]);

  // Default layout for loans
  const defaultLayout: LayoutConfig = {
    accentColor: 'blue',
    title: dynamicTitle,
    sectionName: 'Préstamos',
    emptyMessage: 'No hay préstamos',
    emptyActionLabel: 'Crear Primer Préstamo',
    createButtonLabel: 'Nuevo',
    gridColumns: 3,
    showCreateButton: false,
    emptyIcon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 32V14a4 4 0 014-4h16a4 4 0 014 4v18" />
        <rect x="6" y="28" width="36" height="16" rx="3" />
        <line x1="18" y1="36" x2="30" y2="36" />
        <line x1="24" y1="28" x2="24" y2="44" />
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
