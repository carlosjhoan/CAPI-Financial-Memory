import React, { useState, useMemo } from 'react';
import { Income, IncomeFilters } from '../types/income.types';
import { useDeleteIncome } from '../hooks/useIncomes';
import IncomeCard from './IncomeCard';
import DeleteIncomeModal from './DeleteIncomeModal';
import EntityFinancialSection from '../../../shared/components/EntityFinancialSection';
import type { TimelineConfig } from '../../../shared/components/EntityFinancialSection';
import { useIncomeSection, IncomeSectionReturn } from '../../../core/hooks/useIncomeSection';
import { SessionFilterType } from '../../../shared/components/SessionFilters';
import { formatCurrency } from '../../../core/utils/format';

export interface IncomeListProps {
  filters?: IncomeFilters;
  filterType?: SessionFilterType;
  onEditIncome?: (income: Income) => void;
  onViewIncome?: (income: Income) => void;
  onCreateIncome?: () => void;
  headerActions?: React.ReactNode;
}

/**
 * IncomeList component - now delegates to EntityFinancialSection + useIncomeSection hook.
 * The hook centralizes all queries, pagination, and monthly breakdown logic.
 */
const IncomeList: React.FC<IncomeListProps> = ({
  filters,
  filterType = 'all',
  onEditIncome,
  onViewIncome,
  onCreateIncome,
  headerActions,
}) => {
  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const deleteIncomeMutation = useDeleteIncome();

  // Hook que prepara todas las props para EntityFinancialSection
  const sectionProps: IncomeSectionReturn = useIncomeSection({
    filters,
    filterType,
    onCreate: onCreateIncome,
    card: {
      renderCard: (income: Income, _index: number, accentColor) => (
        <IncomeCard
          income={income}
          onEdit={onEditIncome}
          onDelete={(i) => { setIncomeToDelete(i); setIsDeleteModalOpen(true); }}
          onClick={onViewIncome}
          accentColor={accentColor}
        />
      ),
      getKey: (income: Income) => income.id,
      accentColor: 'green',
    },
  });

  // Handler para eliminar - hook maneja error via onError callback
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

  // Timeline config — compact row for TimelineFeed
  const timelineItems = sectionProps.timelineNavigation?.monthItems ?? sectionProps.items;
  const timelineConfig: TimelineConfig<Income> = useMemo(() => ({
    renderRow: (income: Income) => (
      <div className="flex items-center justify-between min-w-0 gap-3">
        <p className="text-sm font-medium text-secondary-900 dark:text-white truncate min-w-0">
          {income.reason}
        </p>
        <span className="text-sm font-semibold text-green-600 dark:text-green-400 shrink-0">
          +{formatCurrency(income.amount)}
        </span>
      </div>
    ),
    renderPocket: () => 'sin bolsillo',
    getDate: (i: Income) => i.date,
    getStatusDot: () => 'bg-green-500',
    renderFocusCard: (income: Income) => (
      <>
        <div className="h-0.5 bg-green-500/30" />
        <div className="p-4 space-y-2">
          <p className="text-base font-semibold text-secondary-900 dark:text-white">
            {income.reason}
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            +{formatCurrency(income.amount)}
          </p>
          <p className="text-sm text-secondary-400 dark:text-secondary-500">
            {income.date}
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

      <DeleteIncomeModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        income={incomeToDelete}
        onConfirm={handleDeleteConfirm}
        isLoading={false}
      />
    </div>
  );
};

export default IncomeList;