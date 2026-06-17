import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Income } from '../types/income.types';
import { useCreateIncome, useUpdateIncome } from '../hooks/useIncomes';
import IncomeList from '../components/IncomeList';
import IncomeForm from '../components/IncomeForm';
import Modal from '../../../shared/components/Modal';
import { SessionFilterType } from '../../../shared/components/SessionFilters';
import FloatingActionButton from '../../../shared/components/FloatingActionButton';
import FloatingFilterToggle from '../../../shared/components/FloatingFilterToggle';
import { IncomeFormData } from '../hooks/useIncomeForm';
import { useFilterContext } from '../../../core/contexts';

const IncomesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pocketId = searchParams.get('pocketId');

  const {
    filterType,
    debouncedFilters,
    updateFilters,
    clearFilters,
    setFilterType,
    setSelectedYear,
    setSelectedMonth,
  } = useFilterContext();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [incomeToEdit, setIncomeToEdit] = useState<Income | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    if (pocketId) {
      setIsCreateModalOpen(true);
    }
  }, [pocketId]);

  const createIncomeMutation = useCreateIncome();
  const updateIncomeMutation = useUpdateIncome();

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

  const handleCreateIncome = async (data: IncomeFormData) => {
    await createIncomeMutation.mutateAsync(data);
    setIsCreateModalOpen(false);
  };

  const handleUpdateIncome = async (data: IncomeFormData) => {
    if (!incomeToEdit) return;
    await updateIncomeMutation.mutateAsync({ id: incomeToEdit.id, data });
    setIncomeToEdit(null);
  };

  const handleViewIncome = (income: Income) => {
    navigate(`/incomes/${income.id}`);
  };

  const handleEditIncome = (income: Income) => {
    setIncomeToEdit(income);
  };

  return (
    <>
      {/* ═══ FAB — hidden when filter sheet is open ═══ */}
      {!isFilterOpen && (
        <FloatingActionButton
          onClick={() => setIsCreateModalOpen(true)}
          label="Nuevo Ingreso"
          accentColor="green"
        />
      )}

      {/* ═══ Content ═══ */}
      <div className="space-y-6">
      <FloatingFilterToggle
        onFilterChange={handleSessionFilterChange}
        defaultFilter={filterType}
        accentColor="green"
        onIsOpenChange={setIsFilterOpen}
      />
      <IncomeList
        filterType={filterType}
        filters={debouncedFilters}
        onEditIncome={handleEditIncome}
        onViewIncome={handleViewIncome}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nuevo Ingreso"
        size="lg"
        glass
        glassBackdrop
        accentColor="34,197,94"
      >
        <IncomeForm
          onSubmit={handleCreateIncome}
          isLoading={createIncomeMutation.isPending}
          initialPocketId={pocketId || undefined}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!incomeToEdit}
        onClose={() => setIncomeToEdit(null)}
        title="Editar Ingreso"
        size="lg"
      >
        {incomeToEdit && (
          <IncomeForm
            income={incomeToEdit}
            onSubmit={handleUpdateIncome}
            isLoading={updateIncomeMutation.isPending}
          />
        )}
      </Modal>
    </div>
    </>
  );
};

export default IncomesPage;
