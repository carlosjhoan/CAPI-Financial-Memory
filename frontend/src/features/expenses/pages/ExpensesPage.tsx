import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Expense } from '../types/expense.types';
import { useCreateExpense, useUpdateExpense, useDeleteExpense } from '../hooks/useExpenses';
import ExpenseForm from '../components/ExpenseForm';
import DeleteExpenseModal from '../components/DeleteExpenseModal';
import Modal from '../../../shared/components/Modal';
import EntityFinancialSection from '../../../shared/components/EntityFinancialSection';
import type { TimelineConfig } from '../../../shared/components/EntityFinancialSection';
import SplitPanelLayout from '../../../shared/components/SplitPanelLayout';
import RecordFocusCard from '../../../shared/components/RecordFocusCard';
import KebabPopover from '../../../shared/components/KebabPopover';
import PageGradient from '../../../shared/components/PageGradient';
import { SessionFilterType } from '../../../shared/components/SessionFilters';
import FloatingActionButton from '../../../shared/components/FloatingActionButton';
import FloatingFilterToggle from '../../../shared/components/FloatingFilterToggle';
import { ExpenseFormData } from '../hooks/useExpenseForm';
import { useTheme } from '../../../core/hooks/useTheme';
import { useFilterContext } from '../../../core/contexts';
import { useExpenseSection } from '../../../core/hooks/useExpenseSection';
import { formatCurrency, formatCreatedAtDateLabel, formatDayLabel, formatTime, getMonthYearKey } from '../../../core/utils/format';
import { GlassCard, AllocationBreakdownModal } from '../../../shared/components';

type Tab = 'historia' | 'gestion';

const ExpensesPage: React.FC = () => {
  const { filterType, debouncedFilters, updateFilters, clearFilters, setFilterType, setSelectedYear, setSelectedMonth } = useFilterContext();

  const [tab, setTab] = useState<Tab>('gestion');
  const [focusedExpense, setFocusedExpense] = useState<Expense | null>(null);

  // Animation gate
  const [animated] = useState(() => !sessionStorage.getItem('pfm-expenses-animated'));
  const markAnimated = useCallback(() => {
    if (!sessionStorage.getItem('pfm-expenses-animated')) {
      sessionStorage.setItem('pfm-expenses-animated', 'true');
    }
  }, []);

  const handleTabChange = useCallback((newTab: Tab) => {
    setTab(newTab);
    if (newTab === 'historia') markAnimated();
    if (newTab !== 'historia') setFocusedExpense(null);
  }, [markAnimated]);

  // Modal state (shared between both tabs)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseForBreakdown, setExpenseForBreakdown] = useState<Expense | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();
  const sectionProps = useExpenseSection({
    filters: debouncedFilters,
    filterType,
    card: {
      renderCard: () => null, // placeholder — not used in timeline mode
      getKey: (e: Expense) => e.id,
      accentColor: 'orange',
    },
  });

  const timelineItems = sectionProps.timelineNavigation?.monthItems ?? sectionProps.items;

  // Timeline config for Historia tab — inline variant
  const timelineConfig: TimelineConfig<Expense> | undefined = useMemo(() => {
    if (!sectionProps.timelineNavigation) return undefined;
    return {
      renderRow: (expense: Expense) => (
        <div className="flex items-center justify-between min-w-0 gap-3">
          <p className="text-sm font-medium text-secondary-900 dark:text-white truncate min-w-0">{expense.reason}</p>
          <span className="text-sm font-semibold text-red-500 dark:text-red-400 shrink-0">-{formatCurrency(expense.amount)}</span>
        </div>
      ),
      renderPocket: (expense: Expense) => {
        if (!expense.allocations || expense.allocations.length === 0) return 'sin bolsillo';
        return expense.allocations.length === 1 ? expense.allocations[0].pocketName : `${expense.allocations[0].pocketName} y ${expense.allocations.length - 1} más`;
      },
      getDate: (e: Expense) => e.date,
      getStatusDot: () => 'bg-orange-500',
      currentMonth: sectionProps.timelineNavigation.currentMonth,
      onMonthEnd: sectionProps.timelineNavigation.goToNextMonth,
      transitioning: sectionProps.timelineNavigation.transitioning,
      variant: 'inline',
      animated,
      onFocusItemClick: (item: Expense) => setFocusedExpense(item),
    };
  }, [sectionProps.timelineNavigation, animated]);

  const handleSessionFilterChange = (type: SessionFilterType, range?: { startDate: string; endDate: string }, year?: number, month?: number) => {
    setFilterType(type);
    if (type === 'all') clearFilters();
    else if (type === 'dateRange' && range) updateFilters({ startDate: range.startDate, endDate: range.endDate });
    else if (type === 'yearly' && year) { setSelectedYear(year); updateFilters({ year }); }
    else if (type === 'monthly' && year && month) { setSelectedYear(year); setSelectedMonth(month); updateFilters({ year, month }); }
  };

  const handleCreateExpense = async (data: ExpenseFormData) => {
    await createExpenseMutation.mutateAsync(data);
    setIsCreateModalOpen(false);
  };

  const handleUpdateExpense = async (data: ExpenseFormData) => {
    if (!expenseToEdit) return;
    await updateExpenseMutation.mutateAsync({ id: expenseToEdit.id, data });
    setExpenseToEdit(null);
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    await deleteExpenseMutation.mutateAsync(expenseToDelete.id);
    setIsDeleteModalOpen(false);
    setExpenseToDelete(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setExpenseToDelete(null);
  };

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const heroR = isDark ? 251 : 234;
  const heroG = isDark ? 146 : 88;
  const heroB = isDark ? 60 : 12;

  const totalAmount = sectionProps.summary.overall?.totalAmount ?? sectionProps.summary.yearly?.totalAmount ?? sectionProps.summary.monthly?.totalAmount ?? 0;
  const recordCount = sectionProps.summary.overall?.count ?? sectionProps.summary.yearly?.count ?? sectionProps.summary.monthly?.count ?? 0;

  const dateRangeContext = filterType === 'dateRange' && debouncedFilters?.startDate && debouncedFilters?.endDate
    ? { startDate: debouncedFilters.startDate, endDate: debouncedFilters.endDate }
    : undefined;

  // ── Gestión: accumulated items with month grouping ──
  const gestionItems = sectionProps.items;

  const justLoadedMoreRef = useRef(false);
  const [accumulatedItems, setAccumulatedItems] = useState<Expense[]>(gestionItems);

  const handleLoadMore = useCallback(() => {
    justLoadedMoreRef.current = true;
    sectionProps.onPageChange((sectionProps.paginationMeta?.page ?? 1) + 1);
  }, [sectionProps]);

  useEffect(() => {
    if (justLoadedMoreRef.current) {
      justLoadedMoreRef.current = false;
      const existingIds = new Set(accumulatedItems.map((i) => i.id));
      const fresh = gestionItems.filter((i) => !existingIds.has(i.id));
      if (fresh.length > 0) {
        setAccumulatedItems((prev) => [...prev, ...fresh]);
      }
    } else {
      setAccumulatedItems(gestionItems);
    }
  }, [gestionItems]);

  // Reset on filter changes
  useEffect(() => {
    justLoadedMoreRef.current = false;
    setAccumulatedItems(gestionItems);
  }, [debouncedFilters, filterType]);

  const monthGroups = useMemo(() => {
    const groups = new Map<string, Expense[]>();
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
                  {sectionProps.layout.sectionName || 'Gastos'}
                </h2>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                  {sectionProps.layout.title || 'Resumen de gastos'}
                </p>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <p className="text-2xl font-bold text-red-500 dark:text-red-400">
                  -{formatCurrency(totalAmount)}
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
              tab === 'historia' ? 'border-orange-500 text-orange-600 dark:text-orange-400' : 'border-transparent text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300'
            }`}>Historia</button>
          <button onClick={() => handleTabChange('gestion')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'gestion' ? 'border-orange-500 text-orange-600 dark:text-orange-400' : 'border-transparent text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300'
            }`}>Gestión</button>
        </div>

        {/* ── CONTENT ── */}
        {tab === 'gestion' ? (
          <div className="relative">
            {/* Floating buttons */}
            <div className="relative">
              <FloatingFilterToggle onFilterChange={handleSessionFilterChange} defaultFilter={filterType} accentColor="orange" onIsOpenChange={setIsFilterOpen} />
              {!isFilterOpen && <FloatingActionButton onClick={() => setIsCreateModalOpen(true)} label="Nuevo Gasto" accentColor="orange" />}
            </div>

            {/* Grouped cards with load more */}
            {accumulatedItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-secondary-400 dark:text-secondary-500">No hay gastos</p>
                <button onClick={() => setIsCreateModalOpen(true)}
                  className="mt-2 text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline">
                  Crear Primer Gasto
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
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-[10px] font-semibold text-red-700 dark:text-red-400 not-uppercase tracking-normal leading-none">
                          -{formatCurrency(totalAmount)}
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-secondary-100 dark:bg-secondary-800 text-[10px] font-semibold text-secondary-500 dark:text-secondary-400 not-uppercase tracking-normal leading-none">
                          {items.length} {items.length === 1 ? 'gasto' : 'gastos'}
                        </span>
                      </button>

                      {/* Month items */}
                      {!isCollapsed && (
                        <div className="mt-3 space-y-2">
                          {items.map((expense) => (
                            <GlassCard key={expense.id} accentColor="251,146,60">
                              <div className="flex items-center gap-3">
                                {/* Day */}
                                <div className="flex flex-col items-center min-w-[40px]">
                                  <span className="text-lg font-bold text-secondary-900 dark:text-white leading-none">
                                    {formatDayLabel(expense.date)}
                                  </span>
                                </div>
                                {/* Separator */}
                                <div className="w-px h-10 bg-secondary-200 dark:bg-secondary-700" />
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                                    {expense.reason}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <p className="text-xs text-secondary-400 dark:text-secondary-500 truncate">
                                      {expense.allocations && expense.allocations.length > 0
                                        ? `${expense.allocations.map(a => a.pocketName).join(' | ')}`
                                        : 'Bolsillo eliminado'}
                                    </p>
                                    {expense.allocations && expense.allocations.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => setExpenseForBreakdown(expense)}
                                        className="shrink-0 p-0.5 rounded text-secondary-400 hover:text-orange-500 hover:bg-orange-500/10 transition-colors"
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
                                  <span className="text-sm font-semibold text-red-500 dark:text-red-400">
                                    -{formatCurrency(expense.amount)}
                                  </span>
                                  <span className="text-[10px] text-secondary-400 dark:text-secondary-500 leading-none mt-0.5 flex items-center gap-1">
                                    <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                    {formatCreatedAtDateLabel(expense.createdAt)}
                                    <span className="text-secondary-300 dark:text-secondary-600">·</span>
                                    <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {formatTime(expense.createdAt)}
                                  </span>
                                </div>
                                {/* Kebab */}
                                <KebabPopover
                                  actions={[
                                    { label: 'Editar', onClick: () => setExpenseToEdit(expense) },
                                    { label: 'Eliminar', danger: true, onClick: () => { setExpenseToDelete(expense); setIsDeleteModalOpen(true); } },
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
                      className="text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
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
              <div>
                <EntityFinancialSection
                  {...sectionProps}
                  items={timelineItems}
                  dateRangeContext={dateRangeContext}
                  timeline={timelineConfig}
                  hideHero
                />
              </div>
            }
            right={
              focusedExpense ? (
                <div className="p-4">
                  <RecordFocusCard
                    item={focusedExpense}
                    renderDetail={(expense: Expense) => (
                      <div>
                        <div className="h-0.5 bg-orange-500/30" />
                        <div className="p-4 space-y-2">
                          <p className="text-base font-semibold text-secondary-900 dark:text-white">{expense.reason}</p>
                          <p className="text-2xl font-bold text-red-500 dark:text-red-400">-{formatCurrency(expense.amount)}</p>
                          <p className="text-sm text-secondary-400 dark:text-secondary-500">{expense.date}</p>
                          <div className="flex gap-2 pt-2 border-t border-secondary-200 dark:border-secondary-700">
                            <button onClick={() => setExpenseToEdit(expense)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800/40 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              Editar
                            </button>
                            <button onClick={() => { setExpenseToDelete(expense); setIsDeleteModalOpen(true); }}
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
            showRightOnMobile={!!focusedExpense}
            onMobileDismiss={() => setFocusedExpense(null)}
          />
          </div>
        )}
      </div>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Nuevo Gasto" size="lg" glass glassBackdrop accentColor="239,68,68">
        <ExpenseForm onSubmit={handleCreateExpense} onCancel={() => setIsCreateModalOpen(false)} isLoading={createExpenseMutation.isPending} />
      </Modal>
      <Modal isOpen={!!expenseToEdit} onClose={() => setExpenseToEdit(null)} title="Editar Gasto" size="lg" showCloseButton={false}>
        {expenseToEdit && <ExpenseForm expense={expenseToEdit} onSubmit={handleUpdateExpense} onCancel={() => setExpenseToEdit(null)} isLoading={updateExpenseMutation.isPending} />}
      </Modal>
      <DeleteExpenseModal isOpen={isDeleteModalOpen} onClose={handleDeleteCancel} expense={expenseToDelete} onConfirm={handleDeleteConfirm} isLoading={deleteExpenseMutation.isPending} />
      <AllocationBreakdownModal
        isOpen={!!expenseForBreakdown}
        onClose={() => setExpenseForBreakdown(null)}
        title="Detalle por Bolsillo"
        allocations={expenseForBreakdown?.allocations ?? []}
        accentColor="239,68,68"
      />
    </>
  );
};

export default ExpensesPage;