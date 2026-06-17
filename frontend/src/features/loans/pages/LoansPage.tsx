import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loan } from '../types/loan.types';
import { useCreateLoan, useUpdateLoan } from '../hooks/useLoans';
import LoanList from '../components/LoanList';
import LoanForm from '../components/LoanForm';
import Modal from '../../../shared/components/Modal';
import { SessionFilterType } from '../../../shared/components/SessionFilters';
import FloatingActionButton from '../../../shared/components/FloatingActionButton';
import FloatingFilterToggle from '../../../shared/components/FloatingFilterToggle';
import { LoanFormData } from '../hooks/useLoanForm';
import { useFilterContext } from '../../../core/contexts';

const LoansPage: React.FC = () => {
  const navigate = useNavigate();

  // Filtros compartidos vía FilterContext (una sola instancia para Page + List)
  const {
    filterType,
    debouncedFilters,
    updateFilters,
    clearFilters,
    setFilterType,
    setSelectedYear,
    setSelectedMonth,
  } = useFilterContext();

  // Status filter state — controlled desde SessionFilters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paid'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Merge time filters + status filter
  const loanFilters = useMemo(() => ({
    ...debouncedFilters,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  }), [debouncedFilters, statusFilter]);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loanToEdit, setLoanToEdit] = useState<Loan | null>(null);

  // Mutations
  const createLoanMutation = useCreateLoan();
  const updateLoanMutation = useUpdateLoan();

  // Handle filter changes from SessionFilters — actualiza FilterContext
  const handleSessionFilterChange = (
    type: SessionFilterType,
    range?: { startDate: string; endDate: string },
    year?: number,
    month?: number
  ) => {
    setFilterType(type);

    if (type === 'all') {
      clearFilters();
    } else if (type === 'dateRange' && range) {
      updateFilters({ startDate: range.startDate, endDate: range.endDate });
    } else if (type === 'yearly' && year) {
      setSelectedYear(year);
      updateFilters({ year });
    } else if (type === 'monthly' && year && month) {
      setSelectedYear(year);
      setSelectedMonth(month);
      updateFilters({ year, month });
    }
  };

  const handleCreateLoan = async (data: LoanFormData) => {
    await createLoanMutation.mutateAsync({
      initialAmount: data.initialAmount,
      interestRate: data.interestRate,
      installment: data.installment,
      debtor: data.debtor,
      date: data.date,
    });
    setIsCreateModalOpen(false);
  };

  const handleUpdateLoan = async (data: LoanFormData) => {
    if (!loanToEdit) return;

    await updateLoanMutation.mutateAsync({
      id: loanToEdit.id,
      data: {
        interestRate: data.interestRate,
        installment: data.installment,
        debtor: data.debtor,
      },
    });
    setLoanToEdit(null);
  };

  const handleViewLoan = (loan: Loan) => {
    navigate(`/loans/${loan.id}`);
  };

  const handleEditLoan = (loan: Loan) => {
    setLoanToEdit(loan);
  };

  return (
    <>
      {/* ═══ FAB — hidden when filter sheet is open ═══ */}
      {!isFilterOpen && (
        <FloatingActionButton
          onClick={() => setIsCreateModalOpen(true)}
          label="Nuevo Préstamo"
          accentColor="blue"
        />
      )}

      {/* ═══ Content ═══ */}
      <div className="space-y-6">
      <FloatingFilterToggle
        onFilterChange={handleSessionFilterChange}
        defaultFilter={filterType}
        accentColor="blue"
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onIsOpenChange={setIsFilterOpen}
      />
      <LoanList
          filterType={filterType}
          filters={loanFilters}
          onEditLoan={handleEditLoan}
          onViewLoan={handleViewLoan}
          onCreateLoan={() => setIsCreateModalOpen(true)}
        />

        {/* Modal para crear préstamo */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Nuevo Préstamo"
          size="lg"
        glass
        glassBackdrop
        accentColor="59,130,246"
      >
        <LoanForm
          onSubmit={handleCreateLoan}
          isLoading={createLoanMutation.isPending}
        />
        </Modal>

        {/* Modal para editar préstamo */}
        <Modal
          isOpen={!!loanToEdit}
          onClose={() => setLoanToEdit(null)}
          title="Editar Préstamo"
          size="lg"
      >
        {loanToEdit && (
          <LoanForm
            loan={loanToEdit}
            onSubmit={handleUpdateLoan}
            isLoading={updateLoanMutation.isPending}
          />
          )}
        </Modal>
    </div>
    </>
  );
};

export default LoansPage;
