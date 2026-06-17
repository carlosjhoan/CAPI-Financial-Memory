import React, { useMemo, useCallback } from 'react';

import Button from './Button';
import PaginationControls from './PaginationControls';
import MonthlyBreakdownGrid, { AccentColor } from './MonthlyBreakdownGrid';
import TimelineFeed from './TimelineFeed';
import { PaginatedMeta } from '../../core/types/base.types';
import { formatCurrency } from '../../core/utils/format';
import { useTheme } from '../../core/hooks/useTheme';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export type ViewMode = 'all' | 'monthly' | 'yearly' | 'dateRange';

export interface MonthlySummaryData {
  month: string | number;
  year: number;
  totalAmount: number;
  count: number;
  activeCount?: number;
  paidCount?: number;
}

export interface YearlySummaryData {
  year: number;
  totalAmount: number;
  count: number;
  activeCount?: number;
  paidCount?: number;
  monthlyBreakdown: Record<string, number>;
}

export interface OverallSummaryData {
  totalAmount: number;
  count: number;
  activeCount?: number;
  paidCount?: number;
}

export interface CardRenderConfig<T> {
  renderCard: (item: T, index: number, accentColor?: AccentColor) => React.ReactNode;
  getKey: (item: T) => string;
  accentColor?: AccentColor;
}

/** Configuración opcional para TimelineFeed — reemplaza el grid de cards */
export interface TimelineConfig<T> {
  renderRow: (item: T, index: number) => React.ReactNode;
  getDate: (item: T) => string;
  getStatusDot?: (item: T) => string | undefined;
  renderPocket?: (item: T) => React.ReactNode;
  /** Optional value/amount renderer — revealed last in auto-play progressive sequence */
  renderValue?: (item: T) => React.ReactNode;
  /** Optional focus card renderer — shown with glassmorphism overlay when a dot explodes */
  renderFocusCard?: (item: T) => React.ReactNode;

  // ── Month navigation (timeline-buffer) ──
  currentMonth?: { month: number; year: number; monthName: string } | null;
  onMonthEnd?: () => void;
  transitioning?: boolean;
}

/** Contexto de fechas para la narrative en viewMode 'dateRange' */
export interface DateRangeContext {
  startDate: string;
  endDate: string;
}

/** Agrupación: resúmenes por tipo de vista */
export interface SummaryController {
  monthly?: MonthlySummaryData | null;
  yearly?: YearlySummaryData | null;
  overall?: OverallSummaryData | null;
}

/** Agrupación: desglose mensual + paginación del mes seleccionado */
export interface MonthlyBreakdownController {
  selectedMonth?: string | null;
  onMonthSelect?: (month: string | null) => void;
  selectedItems?: unknown[];
  selectedPagination?: PaginatedMeta;
  onSelectedPageChange?: (page: number) => void;
}

/** Agrupación: config visual y textos */
export interface LayoutConfig {
  accentColor?: AccentColor;
  title?: string;
  totalLabel?: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  createButtonLabel?: string;
  gridColumns?: 1 | 2 | 3 | 4;
  className?: string;
  showCreateButton?: boolean;
  /** Icono grande para el estado vacío (responsivo: se adapta a mobile/tablet/desktop) */
  emptyIcon?: React.ReactNode;
  /** Nombre de la sección ('Ingresos', 'Gastos', 'Deudas', 'Préstamos') para mensajes mensuales */
  sectionName?: string;
}

export interface EntityFinancialSectionProps<T> {
  // Core data
  items: T[];
  paginationMeta?: PaginatedMeta;
  error?: Error | null;
  viewMode: ViewMode;

  // Card configuration
  card: CardRenderConfig<T>;

  // Actions
  onPageChange?: (page: number) => void;
  onCreate?: () => void;

  // Agrupaciones (opcionales)
  summary?: SummaryController;
  monthlyBreakdown?: MonthlyBreakdownController;
  layout?: LayoutConfig;

  /** Contexto de fechas para narrative en viewMode dateRange */
  dateRangeContext?: DateRangeContext;

  /** Si se provee, reemplaza el grid de cards con TimelineFeed */
  timeline?: TimelineConfig<T>;

  /** Acciones del header (filtros + botón crear) que se renderizan dentro del mismo background tintado */
  headerActions?: React.ReactNode;
}

function EntityFinancialSection<T>({
  items,
  paginationMeta,
  error,
  viewMode,
  card,
  onPageChange,
  onCreate,
  summary,
  monthlyBreakdown,
  layout,
  dateRangeContext,
  timeline,
  headerActions,
}: EntityFinancialSectionProps<T>) {

  const {
    accentColor = 'green',
    emptyMessage = 'No hay registros',
    emptyActionLabel = 'Crear Primer Registro',
    gridColumns = 3,
    className = '',
    emptyIcon,
    sectionName,
  } = layout ?? {};

  // Button variant based on accentColor
  const buttonVariant = accentColor === 'red' ? 'danger' : accentColor === 'blue' ? 'primary' : 'success';
  
  // Grid columns based on layout.gridColumns
  const gridColumnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  }[gridColumns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  // Handlers for pagination
  const handlePageChange = useCallback((page: number) => {
    onPageChange?.(page);
  }, [onPageChange]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMonthClick = useCallback((_month: string) => {
    // Fallback: no-op si monthlyBreakdown.onMonthSelect no está disponible
  }, []);

  // Meses deshabilitados en vista yearly: los que aún no han transcurrido
  const disabledMonths: string[] = useMemo(() => {
    if (viewMode !== 'yearly' || !summary?.yearly) return [];

    const currentYear = new Date().getFullYear();
    const viewYear = summary.yearly.year;

    // Año pasado → todos los meses ya ocurrieron
    if (viewYear < currentYear) return [];
    // Año futuro → todos los meses están deshabilitados
    if (viewYear > currentYear) {
      return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
              'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    }

    // Mismo año: deshabilitar desde el mes siguiente al actual
    const currentMonthIndex = new Date().getMonth(); // 0=Enero
    const spanishMonths = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    return spanishMonths.slice(currentMonthIndex + 1);
  }, [viewMode, summary?.yearly]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSelectedMonthPageChange = useCallback((_page: number) => {
    // Fallback: no-op si monthlyBreakdown.onSelectedPageChange no está disponible
  }, []);

  // Helper para color de texto según accentColor
  const amountColorClass = {
    red: 'text-red-600 dark:text-red-400',
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    orange: 'text-orange-600 dark:text-orange-400',
    amber: 'text-amber-600 dark:text-amber-400',
    primary: 'text-primary-600 dark:text-primary-400',
  }[accentColor] || 'text-primary-600 dark:text-primary-400';

  // Hero spotlight gradient — radial gradient centrado en el contenido
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const heroGradientMap: Record<string, { r:number; g:number; b:number; rDark:number; gDark:number; bDark:number }> = {
    green:  { r: 22, g: 163, b: 74,   rDark: 74,  gDark: 222, bDark: 128 },
    orange: { r: 234, g: 88, b: 12,   rDark: 251, gDark: 146, bDark: 60 },
    red:    { r: 220, g: 38, b: 38,   rDark: 248, gDark: 113, bDark: 113 },
    blue:   { r: 37, g: 99, b: 235,  rDark: 96,  gDark: 165, bDark: 250 },
    amber:  { r: 217, g: 119, b: 6,   rDark: 251, gDark: 191, bDark: 36 },
    primary:{ r: 37, g: 99, b: 235,  rDark: 96,  gDark: 165, bDark: 250 },
  };

  const hc = heroGradientMap[accentColor] || heroGradientMap.green;
  const hR = isDark ? hc.rDark : hc.r;
  const hG = isDark ? hc.gDark : hc.g;
  const hB = isDark ? hc.bDark : hc.b;

  const heroBgStyle: React.CSSProperties = {
    backgroundImage: [
      `radial-gradient(ellipse 75% 240px at center 40%, rgba(${hR},${hG},${hB},${isDark ? '0.16' : '0.13'}) 0%, transparent 70%)`,
    ].join(', '),
  };

  // Accent RGB para la corriente del borde en RecordFocusCard (cascade via CSS var)
  const accentRgb = `${hR},${hG},${hB}`;

  // Summary computation - displays in header, contextual según viewMode
  const currentSummary = useMemo(() => {
    if (!summary) return null;

    switch (viewMode) {
      case 'monthly':
        if (!summary.monthly) return null;
        return {
          totalAmount: summary.monthly.totalAmount || 0,
          count: summary.monthly.count || 0,
          activeCount: summary.monthly.activeCount,
          paidCount: summary.monthly.paidCount,
        };
      case 'yearly':
        if (!summary.yearly) return null;
        return {
          totalAmount: summary.yearly.totalAmount || 0,
          count: summary.yearly.count || 0,
          activeCount: summary.yearly.activeCount,
          paidCount: summary.yearly.paidCount,
        };
      case 'all':
        if (!summary.overall) return null;
        return {
          totalAmount: summary.overall.totalAmount || 0,
          count: summary.overall.count || 0,
          activeCount: summary.overall.activeCount,
          paidCount: summary.overall.paidCount,
        };
      case 'dateRange':
        // Para dateRange se muestra el resumen general como aproximación
        if (!summary.overall) return null;
        return {
          totalAmount: summary.overall.totalAmount || 0,
          count: summary.overall.count || 0,
          activeCount: summary.overall.activeCount,
          paidCount: summary.overall.paidCount,
        };
      default:
        return null;
    }
  }, [summary, viewMode]);
  
  // Nombres de meses en español para narrative
  const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // Narrative text — cuenta qué representa el total (data storytelling)
  const narrativeText = useMemo(() => {
    const section = (layout?.sectionName || 'registros').toLowerCase();

    switch (viewMode) {
      case 'monthly':
        if (summary?.monthly) {
          const month = summary.monthly.month;
          const monthStr = typeof month === 'number'
            ? MONTHS[(month as number) - 1]?.toLowerCase()
            : (month as string)?.toLowerCase() || '';
          const yearStr = summary.monthly.year || '';
          return `en ${section} · ${monthStr} - ${yearStr}`;
        }
        return `en ${section}`;
      case 'yearly':
        if (summary?.yearly?.year) {
          return `en ${section} · ${summary.yearly.year}`;
        }
        return `en ${section}`;
      case 'dateRange':
        if (dateRangeContext) {
          const s = dateRangeContext.startDate.split('-');
          const e = dateRangeContext.endDate.split('-');
          return `en ${section} · entre ${s[2]}/${s[1]} a ${e[2]}/${e[1]}`;
        }
        return `en ${section}`;
      case 'all':
      default:
        return `Total en ${section}`;
    }
  }, [viewMode, summary, layout?.sectionName, dateRangeContext]);

  // Hero Card content — total + narrative heading + secondary metrics (sin wrapper, se usa desde el band)
  const renderHeroContent = () => {
    if (!currentSummary) return null;

    const hasActivePaid = 'activeCount' in currentSummary && currentSummary.activeCount !== undefined;

    return (
      <>
        {/* Hero total — aria-hidden porque es decorativo/visual */}
        <div aria-hidden="true" className={`text-3xl md:text-4xl font-extrabold ${amountColorClass} leading-none`}>
          {formatCurrency(currentSummary.totalAmount)}
        </div>

        {/* Narrative heading — éste es el h1 semántico de la página */}
        <h1 className="text-sm font-medium text-secondary-500 dark:text-secondary-400">
          {narrativeText}
        </h1>

        {/* Secondary metrics — badges */}
        <div className="flex flex-wrap gap-2 pt-2 justify-center">
          {'count' in currentSummary && currentSummary.count !== undefined && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-600/10 dark:bg-amber-500/15 border border-amber-600/20 dark:border-amber-500/20 text-amber-700 dark:text-amber-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              {currentSummary.count} registros
            </span>
          )}
          {hasActivePaid && (
            <>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400">
                ✗ {currentSummary.activeCount} activas
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400">
                ✓ {currentSummary.paidCount} pagadas
              </span>
            </>
          )}
        </div>
      </>
    );
  };
  
  // Determinamos si es empty state en vista "Todos"
  const isAllEmpty = viewMode === 'all' && items.length === 0;

  // Determinamos si es empty state en vista "Mensual"
  const isMonthlyEmpty = viewMode === 'monthly' && items.length === 0;

  const renderError = () => (
    <div className="text-center py-12">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
        accentColor === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
        accentColor === 'red' ? 'bg-red-100 dark:bg-red-900/30' :
        accentColor === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30' :
        'bg-primary-100 dark:bg-primary-900/30'
      }`}>
        <svg className={`w-6 h-6 ${
          accentColor === 'green' ? 'text-green-600 dark:text-green-400' :
          accentColor === 'red' ? 'text-red-600 dark:text-red-400' :
          accentColor === 'orange' ? 'text-orange-600 dark:text-orange-400' :
          'text-primary-600 dark:text-primary-400'
        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
        Error al cargar registros
      </h3>
      <p className="text-secondary-600 dark:text-secondary-400">
        {error instanceof Error ? error.message : 'No se pudieron cargar los registros'}
      </p>
    </div>
  );

  const renderEmpty = () => (
    <div className="text-center py-8 sm:py-10 md:py-12">
      {/* Icono grande responsivo: móvil más pequeño, escritorio más grande */}
      <div className="flex items-center justify-center mb-4 sm:mb-5 md:mb-6">
        {emptyIcon ? (
          <div className={`w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 ${amountColorClass} opacity-60`}>
            {emptyIcon}
          </div>
        ) : (
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary-100 dark:bg-secondary-800">
            <svg className="w-6 h-6 text-secondary-500 dark:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </div>

      <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 dark:text-white mb-2">
        {emptyMessage}
      </h3>
      <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-400 mb-6">
        Comienza registrando tu primer registro
      </p>
      {onCreate && (
        <Button onClick={onCreate} variant={buttonVariant} size="lg">
          {emptyActionLabel}
        </Button>
      )}
    </div>
  );

  const renderGrid = (data: T[], pagination?: PaginatedMeta, onChange?: (page: number) => void) => (
    <>
      <div className={`grid ${gridColumnClasses} gap-2`}>
        {data.map((item, index) => (
          <React.Fragment key={card.getKey(item)}>
            {card.renderCard(item, index, accentColor)}
          </React.Fragment>
        ))}
      </div>

      {pagination && onChange && pagination.totalPages > 1 && (
        <PaginationControls
          pagination={pagination}
          onPageChange={onChange}
        />
      )}
    </>
  );

  /** Timeline mode or fallback to grid */
  const renderContent = (data: T[], pagination?: PaginatedMeta, onChange?: (page: number) => void) => {
    if (timeline) {
      return (
        <TimelineFeed
          items={data}
          renderRow={timeline.renderRow}
          getKey={card.getKey}
          getDate={timeline.getDate}
          getStatusDot={timeline.getStatusDot}
          renderPocket={timeline.renderPocket}
          renderValue={timeline.renderValue}
          renderFocusCard={timeline.renderFocusCard}
          accentRgb={accentRgb}
          month={timeline.currentMonth?.month ?? 0}
          year={timeline.currentMonth?.year ?? new Date().getFullYear()}
          monthName={timeline.currentMonth?.monthName ?? ''}
          onMonthEnd={timeline.onMonthEnd}
          transitioning={timeline.transitioning ?? false}
        />
      );
    }
    return renderGrid(data, pagination, onChange);
  };

  // ==========================================
  // MAIN RENDER
  // ==========================================

  return (
    <div className={`space-y-3 ${className}`} style={{ '--focus-card-accent-rgb': accentRgb } as React.CSSProperties}>
      {/* ═══ TINTED HEADER BAND — full-viewport bg via absolute layer, content stays in flow ═══ */}
      {currentSummary && !isAllEmpty && !isMonthlyEmpty && (
        <div className="relative -mt-8">
          {/* Full-viewport-width background layer — extendido 2rem arriba por -mt-8 */}
          <div className="absolute inset-x-0 -top-8 bottom-0 w-screen ml-[calc(-50vw_+_50%)]" style={heroBgStyle} />
          {/* Content layer — in normal flow, respects container padding */}
          <div className="relative px-4 md:px-6 py-6 flex flex-col text-center">
            {headerActions && (
              <div className="w-full">
                {headerActions}
              </div>
            )}
            <div className={`flex flex-col items-center self-center${headerActions ? ' mt-4' : ''}`}>
              {renderHeroContent()}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="px-4 md:px-6">
          {renderError()}
        </div>
      )}

      <div className="px-4 md:px-6">
        {/* Monthly View */}
        {viewMode === 'monthly' && !error && (
          <>
            {isMonthlyEmpty ? (
              <div className="text-center py-8 sm:py-10 md:py-12">
                {/* Icono grande responsivo */}
                {emptyIcon && (
                  <div className="flex items-center justify-center mb-4 sm:mb-5 md:mb-6">
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 ${amountColorClass} opacity-60`}>
                      {emptyIcon}
                    </div>
                  </div>
                )}
                <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 dark:text-white mb-2">
                  No hay {sectionName || 'registros'} correspondientes a {summary?.monthly?.month || 'este mes'} de {summary?.monthly?.year || new Date().getFullYear()}
                </h3>
                <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-400 mb-6">
                  Intenta seleccionando otro mes o año
                </p>
              </div>
            ) : summary?.monthly ? (
              renderContent(items, paginationMeta, handlePageChange)
            ) : (
              <p className="text-secondary-600 dark:text-secondary-400">
                No hay datos para este mes
              </p>
            )}
          </>
        )}

        {/* Yearly View with Monthly Breakdown */}
        {viewMode === 'yearly' && !error && (
          <>
            {summary?.yearly ? (
              <div className="space-y-3">
                <MonthlyBreakdownGrid
                  breakdown={summary.yearly.monthlyBreakdown}
                  selectedMonth={monthlyBreakdown?.selectedMonth ?? null}
                  onMonthClick={monthlyBreakdown?.onMonthSelect ?? handleMonthClick}
                  accentColor={accentColor}
                  disabledMonths={disabledMonths}
                />

                {monthlyBreakdown?.selectedMonth && (
                  <div className="mt-3 pt-3 border-t border-secondary-200 dark:border-secondary-700">
                    <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      {monthlyBreakdown.selectedMonth} {monthlyBreakdown.selectedPagination ? `(${monthlyBreakdown.selectedPagination.total} total)` : ''}
                    </h4>
                    {monthlyBreakdown.selectedItems && monthlyBreakdown.selectedItems.length > 0 ? (
                      renderContent(
                        monthlyBreakdown.selectedItems as unknown as T[],
                        monthlyBreakdown.selectedPagination,
                        monthlyBreakdown?.onSelectedPageChange ?? handleSelectedMonthPageChange
                      )
                    ) : (
                      <p className="text-secondary-500 dark:text-secondary-400 text-sm py-4 text-center">
                        No hay registros para {monthlyBreakdown.selectedMonth}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-secondary-600 dark:text-secondary-400">
                No hay datos para este año
              </p>
            )}
          </>
        )}

        {/* All / DateRange View */}
        {(viewMode === 'all' || viewMode === 'dateRange') && !error && (
          <>
            {items && items.length > 0 ? (
              renderContent(items, paginationMeta, handlePageChange)
            ) : timeline ? (
              /* When timeline is active and data is loading, render placeholder instead of empty state (Fix C) */
              <TimelineFeed
                items={[]}
                renderRow={timeline.renderRow}
                getKey={card.getKey}
                getDate={timeline.getDate}
                getStatusDot={timeline.getStatusDot}
                renderPocket={timeline.renderPocket}
                renderValue={timeline.renderValue}
                renderFocusCard={timeline.renderFocusCard}
                accentRgb={accentRgb}
                month={timeline.currentMonth?.month ?? 0}
                year={timeline.currentMonth?.year ?? new Date().getFullYear()}
                monthName={timeline.currentMonth?.monthName ?? ''}
                onMonthEnd={timeline.onMonthEnd}
                transitioning={true}
              />
            ) : viewMode === 'dateRange' ? (
              <div className="text-center py-8 sm:py-10 md:py-12">
                
                {emptyIcon && (
                  <div className="flex items-center justify-center mb-4 sm:mb-5 md:mb-6">
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 ${amountColorClass} opacity-60`}>
                      {emptyIcon}
                    </div>
                  </div>
                )}
                <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 dark:text-white mb-2">
                  No hay {sectionName?.toLowerCase() || 'registros'} correspondientes a estas fechas
                </h3>
                <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-400 mb-6">
                  Intenta seleccionando otro rango de fechas
                </p>
              </div>
            ) : (
              renderEmpty()
            )}
          </>
        )}
      </div>
    </div>
  );
}

const EntityFinancialSectionMemo = React.memo(EntityFinancialSection) as typeof EntityFinancialSection;

export default EntityFinancialSectionMemo;