import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Income } from '../types/income.types';
import { useCreateIncome, useUpdateIncome, useDeleteIncome } from '../hooks/useIncomes';
import IncomeForm from '../components/IncomeForm';
import DeleteIncomeModal from '../components/DeleteIncomeModal';
import Modal from '../../../shared/components/Modal';
import EntityFinancialSection from '../../../shared/components/EntityFinancialSection';
import type { TimelineConfig } from '../../../shared/components/EntityFinancialSection';
import SplitPanelLayout from '../../../shared/components/SplitPanelLayout';
import RecordFocusCard from '../../../shared/components/RecordFocusCard';
import KebabPopover from '../../../shared/components/KebabPopover';
import { useIncomeSection } from '../../../core/hooks/useIncomeSection';
import { SessionFilterType } from '../../../shared/components/SessionFilters';
import FloatingActionButton from '../../../shared/components/FloatingActionButton';
import FloatingFilterToggle from '../../../shared/components/FloatingFilterToggle';
import PageGradient from '../../../shared/components/PageGradient';
import { IncomeFormData } from '../hooks/useIncomeForm';
import { useFilterContext } from '../../../core/contexts';
import { useTheme } from '../../../core/hooks/useTheme';
import { formatCurrency, formatCreatedAtDateLabel, formatDayLabel, formatTime, getMonthYearKey } from '../../../core/utils/format';
import { GlassCard, AllocationBreakdownModal } from '../../../shared/components';

type Tab = 'historia' | 'gestion';

const IncomesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const pocketId = searchParams.get('pocketId');
  const { filterType, debouncedFilters, updateFilters, clearFilters, setFilterType, setSelectedYear, setSelectedMonth } = useFilterContext();

  const [tab, setTab] = useState<Tab>('gestion');
  const [focusedIncome, setFocusedIncome] = useState<Income | null>(null);

  // Animation gate
  const [animated] = useState(() => !sessionStorage.getItem('pfm-incomes-animated'));
  const markAnimated = useCallback(() => {
    if (!sessionStorage.getItem('pfm-incomes-animated')) {
      sessionStorage.setItem('pfm-incomes-animated', 'true');
    }
  }, []);

  const handleTabChange = useCallback((newTab: Tab) => {
    setTab(newTab);
    if (newTab === 'historia') markAnimated();
    if (newTab !== 'historia') setFocusedIncome(null);
  }, [markAnimated]);

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [incomeToEdit, setIncomeToEdit] = useState<Income | null>(null);
  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [incomeForBreakdown, setIncomeForBreakdown] = useState<Income | null>(null);
  const [goalExceeded, setGoalExceeded] = useState<{
    pocketId: string;
    pocketName: string;
    currentGoal: number;
    wouldBeAccumulated: number;
    formData: IncomeFormData;
  } | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const createIncomeMutation = useCreateIncome();
  const updateIncomeMutation = useUpdateIncome();
  const deleteIncomeMutation = useDeleteIncome();

  // Open create modal if pocketId is present in URL
  useEffect(() => {
    if (pocketId) setIsCreateModalOpen(true);
  }, [pocketId]);

  // Section hook for Historia tab
  const sectionProps = useIncomeSection({
    filters: debouncedFilters,
    filterType,
    card: {
      renderCard: () => null,
      getKey: (i: Income) => i.id,
      accentColor: 'green',
    },
  });

  const timelineItems = sectionProps.timelineNavigation?.monthItems ?? sectionProps.items;

  const timelineConfig: TimelineConfig<Income> | undefined = useMemo(() => {
    if (!sectionProps.timelineNavigation) return undefined;
    return {
      renderRow: (income: Income) => (
        <div className="flex items-center justify-between min-w-0 gap-3">
          <p className="text-sm font-medium text-secondary-900 dark:text-white truncate min-w-0">{income.reason}</p>
          <span className="text-sm font-semibold text-green-600 dark:text-green-400 shrink-0">+{formatCurrency(income.amount)}</span>
        </div>
      ),
      renderPocket: (income: Income) => {
        if (!income.allocations || income.allocations.length === 0) return 'sin bolsillo';
        return income.allocations.length === 1 ? income.allocations[0].pocketName : `${income.allocations[0].pocketName} y ${income.allocations.length - 1} más`;
      },
      getDate: (i: Income) => i.date,
      getStatusDot: () => 'bg-green-500',
      currentMonth: sectionProps.timelineNavigation.currentMonth,
      onMonthEnd: sectionProps.timelineNavigation.goToNextMonth,
      transitioning: sectionProps.timelineNavigation.transitioning,
      variant: 'inline',
      animated,
      onFocusItemClick: (item: Income) => setFocusedIncome(item),
    };
  }, [sectionProps.timelineNavigation, animated]);

  const handleSessionFilterChange = (type: SessionFilterType, range?: { startDate: string; endDate: string }, year?: number, month?: number) => {
    setFilterType(type);
    if (type === 'all') clearFilters();
    else if (type === 'dateRange' && range) updateFilters({ startDate: range.startDate, endDate: range.endDate });
    else if (type === 'yearly' && year) { setSelectedYear(year); updateFilters({ year }); }
    else if (type === 'monthly' && year && month) { setSelectedYear(year); setSelectedMonth(month); updateFilters({ year, month }); }
  };

  const handleCreateIncome = async (data: IncomeFormData) => {
    await createIncomeMutation.mutateAsync(data);
    setIsCreateModalOpen(false);
  };

  const handleUpdateIncome = async (data: IncomeFormData) => {
    if (!incomeToEdit) return;
    try {
      await updateIncomeMutation.mutateAsync({ id: incomeToEdit.id, data });
      setIncomeToEdit(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const match = msg.match(/^INCOME_EDIT_EXCEEDS_GOAL:(.+?):(.+?):([\d.]+):([\d.]+)$/);
      if (match) {
        setGoalExceeded({
          pocketId: match[1],
          pocketName: match[2],
          currentGoal: Number(match[3]),
          wouldBeAccumulated: Number(match[4]),
          formData: data,
        });
      } else {
        throw err;
      }
    }
  };

  const handleExtendGoal = async () => {
    if (!incomeToEdit || !goalExceeded) return;
    const goals: Record<string, number> = {
      [goalExceeded.pocketId]: Math.max(
        goalExceeded.currentGoal,
        Math.ceil(goalExceeded.wouldBeAccumulated),
      ),
    };
    await updateIncomeMutation.mutateAsync({
      id: incomeToEdit.id,
      data: { ...goalExceeded.formData, goals },
    });
    setIncomeToEdit(null);
    setGoalExceeded(null);
  };

  const handleDeleteConfirm = async () => {
    if (!incomeToDelete) return;
    await deleteIncomeMutation.mutateAsync(incomeToDelete.id);
    setIsDeleteModalOpen(false);
    setIncomeToDelete(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setIncomeToDelete(null);
  };

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const heroR = isDark ? 74 : 22;
  const heroG = isDark ? 222 : 163;
  const heroB = isDark ? 128 : 74;

  const totalAmount = sectionProps.summary.overall?.totalAmount ?? sectionProps.summary.yearly?.totalAmount ?? sectionProps.summary.monthly?.totalAmount ?? 0;
  const recordCount = sectionProps.summary.overall?.count ?? sectionProps.summary.yearly?.count ?? sectionProps.summary.monthly?.count ?? 0;

  const dateRangeContext = filterType === 'dateRange' && debouncedFilters?.startDate && debouncedFilters?.endDate
    ? { startDate: debouncedFilters.startDate, endDate: debouncedFilters.endDate }
    : undefined;

  // ── Gestión: accumulated items with month grouping ──
  const gestionItems = sectionProps.items;

  const justLoadedMoreRef = useRef(false);
  const [accumulatedItems, setAccumulatedItems] = useState<Income[]>(gestionItems);

  const handleLoadMore = useCallback(() => {
    justLoadedMoreRef.current = true;
    sectionProps.onPageChange((sectionProps.paginationMeta?.page ?? 1) + 1);
  }, [sectionProps]);

  useEffect(() => {
    if (justLoadedMoreRef.current) {
      justLoadedMoreRef.current = false;
      setAccumulatedItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const fresh = gestionItems.filter((i) => !existingIds.has(i.id));
        return fresh.length > 0 ? [...prev, ...fresh] : prev;
      });
    } else {
      setAccumulatedItems(gestionItems);
    }
  }, [gestionItems]);

  // Reset on filter changes
  useEffect(() => {
    justLoadedMoreRef.current = false;
    setAccumulatedItems(gestionItems);
  }, [debouncedFilters, filterType, gestionItems]);

  const monthGroups = useMemo(() => {
    const groups = new Map<string, Income[]>();
    for (const item of accumulatedItems) {
      const key = getMonthYearKey(item.date);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries());
  }, [accumulatedItems]);

  // All months expanded by default — user can collapse
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const toggleMonth = (monthYear: string) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthYear)) next.delete(monthYear);
      else next.add(monthYear);
      return next;
    });
  };

  const hasMore = (sectionProps.paginationMeta?.totalPages ?? 1) > (sectionProps.paginationMeta?.page ?? 1);

  return (
    <>
      <div className="relative z-0">
        <PageGradient r={heroR} g={heroG} b={heroB} isDark={isDark} static />
        <div className="space-y-6">
        {/* ── HEADER: summary above tabs ── */}
        <div className="relative -mt-8">
          <div className="relative pt-0 pb-5">
            <div className="flex items-baseline justify-between">
              <div>
                <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
                  {sectionProps.layout.sectionName || 'Ingresos'}
                </h2>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                  {sectionProps.layout.title || 'Resumen de ingresos'}
                </p>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  +{formatCurrency(totalAmount)}
                </p>
                {recordCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-600/10 dark:bg-amber-500/15 border border-amber-600/20 dark:border-amber-500/20 text-amber-700 dark:text-amber-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                    {recordCount} {recordCount === 1 ? 'registro' : 'registros'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="relative flex border-b border-secondary-200 dark:border-secondary-700">
          <button onClick={() => handleTabChange('historia')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'historia' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300'
            }`}>Historia</button>
          <button onClick={() => handleTabChange('gestion')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'gestion' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300'
            }`}>Gestión</button>
        </div>

        {/* ── CONTENT ── */}
        {tab === 'gestion' ? (
          <div className="relative">
            {/* Floating buttons */}
            <div className="relative">
              <FloatingFilterToggle onFilterChange={handleSessionFilterChange} defaultFilter={filterType} accentColor="green" onIsOpenChange={setIsFilterOpen} />
              {!isFilterOpen && <FloatingActionButton onClick={() => setIsCreateModalOpen(true)} label="Nuevo Ingreso" accentColor="green" />}
            </div>

            {/* Grouped cards with load more */}
            {accumulatedItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-secondary-400 dark:text-secondary-500">No hay ingresos</p>
                <button onClick={() => setIsCreateModalOpen(true)}
                  className="mt-2 text-sm font-medium text-green-600 dark:text-green-400 hover:underline">
                  Crear Primer Ingreso
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {monthGroups.map(([monthYear, items]) => {
                  const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
                  const isCollapsed = collapsedMonths.has(monthYear);
                  return (
                    <div key={monthYear}>
                      {/* Month header */}
                      <button
                        onClick={() => toggleMonth(monthYear)}
                        className="flex items-center gap-2 w-full text-left text-xs font-semibold uppercase tracking-widest text-secondary-400 dark:text-secondary-500 py-2 border-b border-secondary-200 dark:border-secondary-700/50 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors"
                      >
                        <svg className={`w-3 h-3 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        <span>{monthYear}</span>
                        <span className="text-secondary-400 dark:text-secondary-500">·</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-[10px] font-semibold text-green-700 dark:text-green-400 not-uppercase tracking-normal leading-none">
                          +{formatCurrency(totalAmount)}
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-secondary-100 dark:bg-secondary-800 text-[10px] font-semibold text-secondary-500 dark:text-secondary-400 not-uppercase tracking-normal leading-none">
                          {items.length} {items.length === 1 ? 'ingreso' : 'ingresos'}
                        </span>
                      </button>

                      {/* Month items */}
                      {!isCollapsed && (
                        <div className="mt-3 space-y-2">
                          {items.map((income) => (
                            <GlassCard key={income.id} accentColor="34,197,94">
                              <div className="flex items-center gap-3">
                                {/* Day */}
                                <div className="flex flex-col items-center min-w-[40px]">
                                  <span className="text-lg font-bold text-secondary-900 dark:text-white leading-none">
                                    {formatDayLabel(income.date)}
                                  </span>
                                </div>
                                {/* Separator */}
                                <div className="w-px h-10 bg-secondary-200 dark:bg-secondary-700" />
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                                    {income.reason}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <p className="text-xs text-secondary-400 dark:text-secondary-500 truncate">
                                      {income.allocations && income.allocations.length > 0
                                        ? `${income.allocations.map(a => a.pocketName).join(' | ')}`
                                        : 'Bolsillo eliminado'}
                                    </p>
                                    {income.allocations && income.allocations.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => setIncomeForBreakdown(income)}
                                        className="shrink-0 p-0.5 rounded text-secondary-400 hover:text-green-500 hover:bg-green-500/10 transition-colors"
                                        aria-label="Ver detalle por bolsillo"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {/* Amount + createdAt */}
                                <div className="flex flex-col items-end shrink-0">
                                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                    +{formatCurrency(income.amount)}
                                  </span>
                                  <span className="text-[10px] text-secondary-400 dark:text-secondary-500 leading-none mt-0.5 flex items-center gap-1">
                                    <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                    {formatCreatedAtDateLabel(income.createdAt)}
                                    <span className="text-secondary-300 dark:text-secondary-600">·</span>
                                    <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {formatTime(income.createdAt)}
                                  </span>
                                </div>
                                {/* Kebab */}
                                <KebabPopover
                                  actions={[
                                    { label: 'Editar', onClick: () => setIncomeToEdit(income) },
                                    { label: 'Eliminar', danger: true, onClick: () => { setIncomeToDelete(income); setIsDeleteModalOpen(true); } },
                                  ]}
                                />
                              </div>
                            </GlassCard>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* VER MÁS */}
                {hasMore && (
                  <div className="flex justify-center pt-2 pb-4">
                    <button
                      onClick={handleLoadMore}
                      className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                    >
                      Ver más registros
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── HISTORIA TAB ── */
          <div className="relative">
            <SplitPanelLayout
              left={
                <EntityFinancialSection
                  {...sectionProps}
                  items={timelineItems}
                  dateRangeContext={dateRangeContext}
                  timeline={timelineConfig}
                  hideHero
                />
              }
              right={
                focusedIncome ? (
                  <div className="p-4">
                    <RecordFocusCard
                      item={focusedIncome}
                      renderDetail={(income: Income) => (
                        <div>
                          <div className="h-0.5 bg-green-500/30" />
                          <div className="p-4 space-y-2">
                            <p className="text-base font-semibold text-secondary-900 dark:text-white">{income.reason}</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">+{formatCurrency(income.amount)}</p>
                            <p className="text-sm text-secondary-400 dark:text-secondary-500">{income.date}</p>
                            <div className="flex gap-2 pt-2 border-t border-secondary-200 dark:border-secondary-700">
                              <button onClick={() => setIncomeToEdit(income)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800/40 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                Editar
                              </button>
                              <button onClick={() => { setIncomeToDelete(income); setIsDeleteModalOpen(true); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/30 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      monthName={timelineConfig?.currentMonth?.monthName ?? ''}
                      year={timelineConfig?.currentMonth?.year ?? new Date().getFullYear()}
                    />
                  </div>
                ) : null
              }
              showRightOnMobile={!!focusedIncome}
              onMobileDismiss={() => setFocusedIncome(null)}
            />
          </div>
        )}
      </div>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Nuevo Ingreso" size="lg" glass glassBackdrop accentColor="34,197,94">
        <IncomeForm onSubmit={handleCreateIncome} isLoading={createIncomeMutation.isPending} initialPocketId={pocketId || undefined} />
      </Modal>
      <Modal isOpen={!!incomeToEdit} onClose={() => setIncomeToEdit(null)} title="Editar Ingreso" size="lg">
        {incomeToEdit && <IncomeForm income={incomeToEdit} onSubmit={handleUpdateIncome} isLoading={updateIncomeMutation.isPending} />}
      </Modal>
      <DeleteIncomeModal isOpen={isDeleteModalOpen} onClose={handleDeleteCancel} income={incomeToDelete} onConfirm={handleDeleteConfirm} isLoading={deleteIncomeMutation.isPending} />
      <AllocationBreakdownModal
        isOpen={!!incomeForBreakdown}
        onClose={() => setIncomeForBreakdown(null)}
        title="Detalle por Bolsillo"
        allocations={incomeForBreakdown?.allocations ?? []}
        accentColor="34,197,94"
      />
      <Modal
        isOpen={!!goalExceeded}
        onClose={() => setGoalExceeded(null)}
        title="Meta de ahorro superada"
        description={`La edición supera la meta actual de "${goalExceeded?.pocketName}".`}
        size="sm"
        glass
        glassBackdrop
        accentColor="34,197,94"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800/50 p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-secondary-500 dark:text-secondary-400">Meta actual</span>
              <span className="font-medium text-secondary-900 dark:text-white">
                {formatCurrency(goalExceeded?.currentGoal ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-500 dark:text-secondary-400">Nuevo acumulado</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatCurrency(goalExceeded?.wouldBeAccumulated ?? 0)}
              </span>
            </div>
            <div className="border-t border-secondary-200 dark:border-secondary-700 pt-2 flex justify-between font-semibold">
              <span className="text-secondary-900 dark:text-white">Nueva meta sugerida</span>
              <span className="text-green-600 dark:text-green-400">
                {formatCurrency(
                  goalExceeded
                    ? Math.max(goalExceeded.currentGoal, Math.ceil(goalExceeded.wouldBeAccumulated))
                    : 0,
                )}
              </span>
            </div>
          </div>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 text-center">
            ¿Querés extender la meta para reflejar el nuevo acumulado?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setGoalExceeded(null)}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleExtendGoal}
              disabled={updateIncomeMutation.isPending}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              Extender meta
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default IncomesPage;