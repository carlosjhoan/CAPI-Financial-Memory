import React, { useState, useMemo } from 'react';
import { Expense, ExpenseFilters } from '../types/expense.types';
import { useDeleteExpense } from '../hooks/useExpenses';
import ExpenseCard from './ExpenseCard';
import DeleteExpenseModal from './DeleteExpenseModal';
import EntityFinancialSection from '../../../shared/components/EntityFinancialSection';
import type { TimelineConfig } from '../../../shared/components/EntityFinancialSection';
import { useExpenseSection, ExpenseSectionReturn } from '../../../core/hooks/useExpenseSection';
import { SessionFilterType } from '../../../shared/components/SessionFilters';
import { formatCurrency } from '../../../core/utils/format';

export interface ExpenseListProps {
  filters?: ExpenseFilters;
  filterType?: SessionFilterType;
  onEditExpense?: (expense: Expense) => void;
  onViewExpense?: (expense: Expense) => void;
  onCreateExpense?: () => void;
  headerActions?: React.ReactNode;
}

/**
 * ExpenseList component - now delegates to EntityFinancialSection + useExpenseSection hook.
 * The hook centralizes all queries, pagination, and monthly breakdown logic.
 */
const ExpenseList: React.FC<ExpenseListProps> = ({
  filters,
  filterType = 'all',
  onEditExpense,
  onViewExpense,
  onCreateExpense,
  headerActions,
}) => {
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const deleteExpenseMutation = useDeleteExpense();

  // Hook que prepara todas las props para EntityFinancialSection
  const sectionProps: ExpenseSectionReturn = useExpenseSection({
    filters,
    filterType,
    onCreate: onCreateExpense,
    card: {
      renderCard: (expense: Expense, _index: number, accentColor) => (
        <ExpenseCard
          expense={expense}
          onEdit={onEditExpense}
          onDelete={(e) => { setExpenseToDelete(e); setIsDeleteModalOpen(true); }}
          onClick={onViewExpense}
          accentColor={accentColor}
        />
      ),
      getKey: (expense: Expense) => expense.id,
      accentColor: 'orange',
    },
  });

  // Handler para eliminar - hook maneja error via onError callback
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

  // Timeline config — compact row for TimelineFeed
  const timelineItems = sectionProps.timelineNavigation?.monthItems ?? sectionProps.items;
  const timelineConfig: TimelineConfig<Expense> = useMemo(() => ({
    renderRow: (expense: Expense) => (
      <div className="flex items-center justify-between min-w-0 gap-3">
        <p className="text-sm font-medium text-secondary-900 dark:text-white truncate min-w-0">
          {expense.reason}
        </p>
        <span className="text-sm font-semibold text-red-500 dark:text-red-400 shrink-0">
          -{formatCurrency(expense.amount)}
        </span>
      </div>
    ),
    renderPocket: () => 'sin bolsillo',
    getDate: (e: Expense) => e.date,
    getStatusDot: () => 'bg-orange-500',
    renderFocusCard: (expense: Expense) => (
      <>
        <div className="h-0.5 bg-orange-500/30" />
        <div className="p-4 space-y-2">
          <p className="text-base font-semibold text-secondary-900 dark:text-white">
            {expense.reason}
          </p>
          <p className="text-2xl font-bold text-red-500 dark:text-red-400">
            -{formatCurrency(expense.amount)}
          </p>
          <p className="text-sm text-secondary-400 dark:text-secondary-500">
            {expense.date}
          </p>
        </div>
      </>
    ),
    currentMonth: sectionProps.timelineNavigation?.currentMonth ?? null,
    onMonthEnd: sectionProps.timelineNavigation?.goToNextMonth,
    transitioning: sectionProps.timelineNavigation?.transitioning,
  }), [sectionProps.timelineNavigation]);

  // Date range context for narrative in EntityFinancialSection
  const dateRangeContext = filterType === 'dateRange' && filters?.startDate && filters?.endDate
    ? { startDate: filters.startDate, endDate: filters.endDate }
    : undefined;

  return (
    <div className="space-y-3">
      <EntityFinancialSection {...sectionProps} items={timelineItems} dateRangeContext={dateRangeContext} timeline={timelineConfig} headerActions={headerActions} />

      <DeleteExpenseModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        expense={expenseToDelete}
        onConfirm={handleDeleteConfirm}
        isLoading={false}
      />
    </div>
  );
};

export default ExpenseList;
