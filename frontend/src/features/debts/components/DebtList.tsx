import React, { useState, useMemo } from 'react';
import { Debt, DebtFilters } from '../types/debt.types';
import { useDeleteDebt, useRegisterDebtPayment } from '../hooks/useDebts';
import DebtCard from './DebtCard';
import DeleteDebtModal from './DeleteDebtModal';
import PaymentModal from './PaymentModal';
import EntityFinancialSection from '../../../shared/components/EntityFinancialSection';
import type { TimelineConfig } from '../../../shared/components/EntityFinancialSection';
import { useDebtSection, DebtSectionReturn } from '../../../core/hooks/useDebtSection';
import { SessionFilterType } from '../../../shared/components/SessionFilters';
import { formatCurrency } from '../../../core/utils/format';

export interface DebtListProps {
  filters?: DebtFilters;
  filterType?: SessionFilterType;
  onEditDebt?: (debt: Debt) => void;
  onViewDebt?: (debt: Debt) => void;
  onCreateDebt?: () => void;
  headerActions?: React.ReactNode;
}

/**
 * DebtList component - now delegates to EntityFinancialSection + useDebtSection hook.
 * The hook centralizes all queries, pagination, and monthly breakdown logic.
 */
const DebtList: React.FC<DebtListProps> = ({
  filters,
  filterType = 'all',
  onEditDebt,
  onViewDebt,
  onCreateDebt,
  headerActions,
}) => {
  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [debtForPayment, setDebtForPayment] = useState<Debt | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const deleteDebtMutation = useDeleteDebt();
  const registerPaymentMutation = useRegisterDebtPayment();

  // Hook que prepara todas las props para EntityFinancialSection
  const sectionProps: DebtSectionReturn = useDebtSection({
    filters,
    filterType,
    onCreate: onCreateDebt,
    card: {
      renderCard: (debt: Debt, _index: number, accentColor) => (
        <DebtCard
          debt={debt}
          onEdit={onEditDebt}
          onDelete={(d) => { setDebtToDelete(d); setIsDeleteModalOpen(true); }}
          onClick={onViewDebt}
          onRegisterPayment={(d) => { setDebtForPayment(d); setIsPaymentModalOpen(true); }}
          accentColor={accentColor}
        />
      ),
      getKey: (debt: Debt) => debt.id,
      accentColor: 'red',
    },
  });

  // Handler para eliminar - hook maneja error via onError callback
  const handleDeleteConfirm = async () => {
    if (!debtToDelete) return;

    await deleteDebtMutation.mutateAsync(debtToDelete.id);
    setIsDeleteModalOpen(false);
    setDebtToDelete(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDebtToDelete(null);
  };

  // Handler para pago
  const handlePaymentSubmit = async (data: { debtId: string; amount: number }) => {
    await registerPaymentMutation.mutateAsync(data);
    setIsPaymentModalOpen(false);
    setDebtForPayment(null);
  };

  const handlePaymentCancel = () => {
    setIsPaymentModalOpen(false);
    setDebtForPayment(null);
  };

  // Timeline config — compact row for TimelineFeed
  const timelineItems = sectionProps.timelineNavigation?.monthItems ?? sectionProps.items;
  const timelineConfig: TimelineConfig<Debt> = useMemo(() => ({
    renderRow: (debt: Debt) => (
      <div className="flex items-center justify-between min-w-0 gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
            {debt.lender}
          </p>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate leading-tight">
            {debt.reason}
          </p>
        </div>
        <span className="text-sm font-semibold text-secondary-900 dark:text-white shrink-0">
          {formatCurrency(debt.finalAmount)}
        </span>
      </div>
    ),
    getDate: (d: Debt) => d.date,
    getStatusDot: () => 'bg-red-500',
    renderFocusCard: (debt: Debt) => (
      <>
        <div className="h-0.5 bg-red-500/30" />
        <div className="p-4 space-y-2">
          <p className="text-base font-semibold text-secondary-900 dark:text-white">
            {debt.lender}
          </p>
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            {debt.reason}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-secondary-400 dark:text-secondary-500">
              Adeudo total
            </span>
            <span className="text-lg font-bold text-red-500 dark:text-red-400">
              {formatCurrency(debt.finalAmount)}
            </span>
          </div>
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

      <DeleteDebtModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        debt={debtToDelete}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteDebtMutation.isPending}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handlePaymentCancel}
        debt={debtForPayment}
        onSubmit={handlePaymentSubmit}
        isLoading={registerPaymentMutation.isPending}
      />
    </div>
  );
};

export default DebtList;
