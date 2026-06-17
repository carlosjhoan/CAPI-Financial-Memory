import React, { useState, useMemo } from 'react';
import { Loan, LoanFilters } from '../types/loan.types';
import { useDeleteLoan, useRegisterPayment } from '../hooks/useLoans';
import LoanCard from './LoanCard';
import DeleteLoanModal from './DeleteLoanModal';
import RegisterPaymentModal from './RegisterPaymentModal';
import EntityFinancialSection from '../../../shared/components/EntityFinancialSection';
import type { TimelineConfig } from '../../../shared/components/EntityFinancialSection';
import { useLoanSection, LoanSectionReturn } from '../../../core/hooks/useLoanSection';
import type { SessionFilterType } from '../../../shared/components/SessionFilters';
import { formatCurrency } from '../../../core/utils/format';

export interface LoanListProps {
  filters?: LoanFilters;
  filterType?: SessionFilterType;
  onEditLoan?: (loan: Loan) => void;
  onViewLoan?: (loan: Loan) => void;
  onCreateLoan?: () => void;
  headerActions?: React.ReactNode;
}

/**
 * LoanList component — delegates to EntityFinancialSection + useLoanSection hook.
 * The hook centralizes all queries, pagination, and monthly breakdown logic.
 */
const LoanList: React.FC<LoanListProps> = ({
  filters,
  filterType = 'all',
  onEditLoan,
  onViewLoan,
  onCreateLoan,
  headerActions,
}) => {
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loanForPayment, setLoanForPayment] = useState<Loan | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const deleteLoanMutation = useDeleteLoan();
  const registerPaymentMutation = useRegisterPayment();

  // Hook que prepara todas las props para EntityFinancialSection
  const sectionProps: LoanSectionReturn = useLoanSection({
    filters,
    filterType,
    onCreate: onCreateLoan,
    card: {
      renderCard: (loan: Loan, _index: number, accentColor) => (
        <LoanCard
          loan={loan}
          onEdit={onEditLoan}
          onDelete={(l) => { setLoanToDelete(l); setIsDeleteModalOpen(true); }}
          onClick={onViewLoan}
          onRegisterPayment={(l) => { setLoanForPayment(l); setIsPaymentModalOpen(true); }}
          accentColor={accentColor}
        />
      ),
      getKey: (loan: Loan) => loan.id,
      accentColor: 'blue',
    },
  });

  // Handler para eliminar
  const handleDeleteConfirm = async () => {
    if (!loanToDelete) return;

    await deleteLoanMutation.mutateAsync(loanToDelete.id);
    setIsDeleteModalOpen(false);
    setLoanToDelete(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setLoanToDelete(null);
  };

  // Handler para pago
  const handlePaymentSubmit = async (data: { loanId: string; amount: number }) => {
    await registerPaymentMutation.mutateAsync(data);
    setIsPaymentModalOpen(false);
    setLoanForPayment(null);
  };

  const handlePaymentCancel = () => {
    setIsPaymentModalOpen(false);
    setLoanForPayment(null);
  };

  // Timeline config — compact row for TimelineFeed
  const timelineItems = sectionProps.timelineNavigation?.monthItems ?? sectionProps.items;
  const timelineConfig: TimelineConfig<Loan> = useMemo(() => ({
    renderRow: (loan: Loan) => {
      const expectedReturn = loan.initialAmount * (1 + loan.interestRate / 100);
      const remaining = loan.remainingAmount ?? (expectedReturn - loan.paidAmount);
      return (
        <div className="flex items-center justify-between min-w-0 gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
              {loan.debtor}
            </p>
            <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate leading-tight">
              {formatCurrency(loan.installment)}/mes
            </p>
          </div>
          <span className="text-sm font-semibold text-secondary-900 dark:text-white shrink-0">
            {formatCurrency(remaining)}
          </span>
        </div>
      );
    },
    getDate: (l: Loan) => l.date,
    getStatusDot: () => 'bg-blue-500',
    renderFocusCard: (loan: Loan) => {
      const expectedReturn = loan.initialAmount * (1 + loan.interestRate / 100);
      const remaining = loan.remainingAmount ?? (expectedReturn - loan.paidAmount);
      return (
        <>
          <div className="h-0.5 bg-blue-500/30" />
          <div className="p-4 space-y-2">
            <p className="text-base font-semibold text-secondary-900 dark:text-white">
              {loan.debtor}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-500 dark:text-secondary-400">
                Cuota mensual
              </span>
              <span className="text-sm font-semibold text-secondary-900 dark:text-white">
                {formatCurrency(loan.installment)}/mes
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-500 dark:text-secondary-400">
                Saldo restante
              </span>
              <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>
        </>
      );
    },
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

      <DeleteLoanModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        loan={loanToDelete}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteLoanMutation.isPending}
      />

      <RegisterPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handlePaymentCancel}
        loan={loanForPayment}
        onSubmit={handlePaymentSubmit}
        isLoading={registerPaymentMutation.isPending}
      />
    </div>
  );
};

export default LoanList;
