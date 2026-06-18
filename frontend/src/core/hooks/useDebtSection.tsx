import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Debt, DebtFilters } from '../../features/debts/types/debt.types';
import {
  useDebtsPaginated,
  useDebtMonthlySummary,
  useDebtYearlySummary,
  useDebtOverallSummary,
  useDebtSummary,
} from '../../features/debts/hooks/useDebts';
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
const EN_TO_ES_MONTH_MAP: Record<string, string> = {
  Jan: 'Enero', Feb: 'Febrero', Mar: 'Marzo', Apr: 'Abril',
  May: 'Mayo', Jun: 'Junio', Jul: 'Julio', Aug: 'Agosto',
  Sep: 'Septiembre', Oct: 'Octubre', Nov: 'Noviembre', Dec: 'Diciembre',
};

export interface UseDebtSectionOptions {
  filters?: DebtFilters;
  filterType?: SessionFilterType;
  onCreate?: () => void;
  card: CardRenderConfig<Debt>;
  /** Opcional: sobrescribe layout config por defecto */
  layout?: Partial<LayoutConfig>;
  /** Handlers opcionales */
  onEdit?: (item: Debt) => void;
  onDelete?: (item: Debt) => void;
  onClick?: (item: Debt) => void;
}

export interface DebtSectionReturn {
  items: Debt[];
  paginationMeta: EntityFinancialSectionProps<Debt>['paginationMeta'];
  error: Error | null;
  viewMode: ViewMode;
  card: CardRenderConfig<Debt>;
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
    monthItems: Debt[];
  };
}

/**
 * Hook que prepara todas las props para EntityFinancialSection
 * en el contexto de la sección de Deudas.
 * Centraliza queries, paginación, selección de mes, etc.
 */
export function useDebtSection({
  filters,
  filterType = 'all',
  onCreate,
  card,
  layout: layoutOverride,
}: UseDebtSectionOptions): DebtSectionReturn {
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
  const { data: timelineYearlySummary } = useDebtYearlySummary(timelineYear);

  // Derive available months from timeline yearly summary
  const availableMonths: AvailableMonth[] = useMemo(() => {
    if (!timelineYearlySummary?.monthlyBreakdown) return [];
    return deriveAvailableMonths(timelineYearlySummary.monthlyBreakdown, timelineYear);
  }, [timelineYearlySummary, timelineYear]);

  // Total exhaustion: when we've gone to a previous year and it has NO data,
  // reset to the initial year/month to restart the cycle
  useEffect(() => {
    if (availableMonths.length === 0 && timelineYearlySummary && timelineYear < initialTimelineYearRef.current) {
      setTimelineYear(initialTimelineYearRef.current);
      setTimelineMonthIdx(0);
    }
  }, [availableMonths, timelineYearlySummary, timelineYear]);

  // Current timeline month info
  const currentTimelineMonth = availableMonths[timelineMonthIdx] ?? null;

  // Timeline items query — fetch current month's items with limit=50
  const { data: timelineMonthData } = useDebtsPaginated(
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
  const { data: paginatedData, error } = useDebtsPaginated(
    filters,
    currentPage, 
    LIMIT
  );
  const { data: monthlySummary } = useDebtMonthlySummary(filters?.year, filters?.month);
  const { data: yearlySummary } = useDebtYearlySummary(filters?.year);
  const { data: overallSummary } = useDebtOverallSummary(
    viewMode === 'dateRange' ? filters?.startDate : undefined,
    viewMode === 'dateRange' ? filters?.endDate : undefined
  );
  const { data: debtSummary } = useDebtSummary();

  // Separate query to get yearly record count
  const { data: yearlyCountData } = useDebtsPaginated(
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

  // Query for selected month debts
  const { data: selectedMonthDebts } = useDebtsPaginated(
    selectedMonth ? selectedMonthFilters : undefined,
    selectedMonthPage,
    LIMIT
  );

  // Map filterType to ViewMode
  // Build summary for EntityFinancialSection
  const summary: SummaryController = useMemo(() => {
    // Para vista 'all', usar debtSummary (general)
    if (viewMode === 'all') {
      if (debtSummary) {
        return {
          overall: {
            totalAmount: debtSummary.totalRemaining,
            count: debtSummary.totalDebts,
            activeCount: debtSummary.activeDebtsCount,
            paidCount: debtSummary.fullyPaidCount,
          },
        };
      }
      return {};
    }

    return {
      monthly: monthlySummary ? {
        month: getMonthName(filters?.month ?? 1),
        year: filters?.year ?? new Date().getFullYear(),
        totalAmount: monthlySummary.totalRemaining,
        count: monthlySummary.debtCount,
        activeCount: monthlySummary.activeCount,
        paidCount: monthlySummary.fullyPaidCount,
      } : null,
      yearly: yearlySummary ? {
        year: filters?.year ?? new Date().getFullYear(),
        totalAmount: yearlySummary.totalRemaining,
        count: yearlyRecordCount,
        activeCount: yearlySummary.activeCount,
        paidCount: yearlySummary.fullyPaidCount,
        // Normalizar claves del breakdown de inglés a español (Jan→Enero, Feb→Febrero...)
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
        totalAmount: overallSummary.totalRemaining,
        count: overallSummary.totalDebts,
        activeCount: overallSummary.activeDebtsCount,
        paidCount: overallSummary.fullyPaidCount,
      } : null,
    };
  }, [monthlySummary, yearlySummary, overallSummary, debtSummary, yearlyRecordCount, filters?.month, filters?.year, viewMode]);

  // Monthly breakdown (yearly view)
  const monthlyBreakdown: MonthlyBreakdownController = useMemo(() => ({
    selectedMonth,
    onMonthSelect: (month: string | null) => {
      const spanishMonth = month ? (EN_TO_ES_MONTH_MAP[month] || month) : null;
      setSelectedMonth(spanishMonth);
      setSelectedMonthPage(1);
    },
    selectedItems: selectedMonthDebts?.data ?? [],
    selectedPagination: selectedMonthDebts?.meta,
    onSelectedPageChange: setSelectedMonthPage,
  }), [selectedMonth, selectedMonthDebts]);

  // Page change handler
  const onPageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Auto-correct page if it exceeds totalPages after delete/filter
  useAutoCorrectPage(paginatedData?.meta, currentPage, onPageChange);
  // Monthly breakdown auto-correct: deleting last item on last page of selected month
  useAutoCorrectPage(selectedMonthDebts?.meta, selectedMonthPage, setSelectedMonthPage);

  // Dynamic title
  const dynamicTitle = useMemo(() => {
    if (viewMode === 'dateRange' && filters?.startDate && filters?.endDate) {
      const startFormatted = formatDateMonthShort(filters.startDate);
      const endFormatted = formatDateMonthShort(filters.endDate);
      return `Deudas registradas (Desde ${startFormatted} hasta ${endFormatted})`;
    }
    if (viewMode === 'monthly' && filters?.month && filters?.year) {
      return `Resumen de ${getMonthName(filters.month)} de ${filters.year}`;
    }
    if (viewMode === 'yearly' && filters?.year) {
      return `Resumen del año ${filters.year}`;
    }
    return '';
  }, [viewMode, filters?.month, filters?.year, filters?.startDate, filters?.endDate]);

  // Default layout for debts
  const defaultLayout: LayoutConfig = {
    accentColor: 'red',
    title: dynamicTitle,
    sectionName: 'Deudas',
    emptyMessage: 'No hay deudas',
    emptyActionLabel: 'Crear Primera Deuda',
    createButtonLabel: 'Nueva',
    gridColumns: 3,
    showCreateButton: false,
    emptyIcon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="12" width="40" height="24" rx="3" />
        <line x1="4" y1="20" x2="44" y2="20" />
        <line x1="14" y1="29" x2="34" y2="29" />
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
