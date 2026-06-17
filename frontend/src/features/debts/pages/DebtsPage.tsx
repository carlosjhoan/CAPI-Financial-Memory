import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Debt } from '../types/debt.types';
import { useCreateDebt, useUpdateDebt } from '../hooks/useDebts';
import DebtList from '../components/DebtList';
import DebtForm from '../components/DebtForm';
import Modal from '../../../shared/components/Modal';
import { SessionFilterType } from '../../../shared/components/SessionFilters';
import FloatingActionButton from '../../../shared/components/FloatingActionButton';
import FloatingFilterToggle from '../../../shared/components/FloatingFilterToggle';
import { DebtFormData } from '../hooks/useDebtForm';
import { useFilterContext } from '../../../core/contexts';

const DebtsPage: React.FC = () => {
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
  const debtFilters = useMemo(() => ({
    ...debouncedFilters,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  }), [debouncedFilters, statusFilter]);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [debtToEdit, setDebtToEdit] = useState<Debt | null>(null);

  // Mutations
  const createDebtMutation = useCreateDebt();
  const updateDebtMutation = useUpdateDebt();

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

  const handleCreateDebt = async (data: DebtFormData) => {
    await createDebtMutation.mutateAsync({
      ...data,
      date: data.date || new Date().toISOString().split('T')[0],
      reason: data.reason || 'Me endeudé y no sé ni para qué',
      finalAmount: data.installAmount * data.months,
    });
    setIsCreateModalOpen(false);
  };

  const handleUpdateDebt = async (data: DebtFormData) => {
    if (!debtToEdit) return;
    const { date: _date, ...updateData } = data;
    await updateDebtMutation.mutateAsync({
      id: debtToEdit.id,
      data: updateData,
    });
    setDebtToEdit(null);
  };

  const handleViewDebt = (debt: Debt) => {
    navigate(`/debts/${debt.id}`);
  };

  const handleEditDebt = (debt: Debt) => {
    setDebtToEdit(debt);
  };

  return (
    <>
      {/* ═══ FAB — hidden when filter sheet is open ═══ */}
      {!isFilterOpen && (
        <FloatingActionButton
          onClick={() => setIsCreateModalOpen(true)}
          label="Nueva Deuda"
          accentColor="red"
        />
      )}

      {/* ═══ Content ═══ */}
      <div className="space-y-6">
      <FloatingFilterToggle
        onFilterChange={handleSessionFilterChange}
        defaultFilter={filterType}
        accentColor="red"
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onIsOpenChange={setIsFilterOpen}
      />
      <DebtList
        filterType={filterType}
        filters={debtFilters}
        onEditDebt={handleEditDebt}
        onViewDebt={handleViewDebt}
        onCreateDebt={() => setIsCreateModalOpen(true)}
      />

      {/* Modal para crear deuda */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nueva Deuda"
        size="lg"
        glass
        glassBackdrop
        accentColor="249,115,22"
      >
        <DebtForm
          onSubmit={handleCreateDebt}
          isLoading={createDebtMutation.isPending}
        />
      </Modal>

      {/* Modal para editar deuda */}
      <Modal
        isOpen={!!debtToEdit}
        onClose={() => setDebtToEdit(null)}
        title="Editar Deuda"
        size="lg"
      >
        {debtToEdit && (
          <DebtForm
            debt={debtToEdit}
            onSubmit={handleUpdateDebt}
            isLoading={updateDebtMutation.isPending}
          />
        )}
      </Modal>
    </div>
    </>
  );
};

export default DebtsPage;
