import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Expense } from '../types/expense.types';
import { useCreateExpense, useUpdateExpense } from '../hooks/useExpenses';
import ExpenseList from '../components/ExpenseList';
import ExpenseForm from '../components/ExpenseForm';
import Modal from '../../../shared/components/Modal';
import { SessionFilterType } from '../../../shared/components/SessionFilters';
import FloatingActionButton from '../../../shared/components/FloatingActionButton';
import FloatingFilterToggle from '../../../shared/components/FloatingFilterToggle';
import { ExpenseFormData } from '../hooks/useExpenseForm';
import { useFilterContext } from '../../../core/contexts';

const ExpensesPage: React.FC = () => {
  const navigate = useNavigate();

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
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();

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

  const handleCreateExpense = async (data: ExpenseFormData) => {
    await createExpenseMutation.mutateAsync(data);
    setIsCreateModalOpen(false);
  };

  const handleUpdateExpense = async (data: ExpenseFormData) => {
    if (!expenseToEdit) return;
    await updateExpenseMutation.mutateAsync({ id: expenseToEdit.id, data });
    setExpenseToEdit(null);
  };

  const handleViewExpense = (expense: Expense) => {
    navigate(`/expenses/${expense.id}`);
  };

  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
  };

  return (
    <>
      {/* ═══ Content ═══ */}
      <div className="space-y-6">
      <FloatingFilterToggle
        onFilterChange={handleSessionFilterChange}
        defaultFilter={filterType}
        accentColor="orange"
        onIsOpenChange={setIsFilterOpen}
      />

      {/* ═══ FAB — hidden when filter sheet is open ═══ */}
      {!isFilterOpen && (
        <FloatingActionButton
          onClick={() => setIsCreateModalOpen(true)}
          label="Nuevo Gasto"
          accentColor="orange"
        />
      )}
      <ExpenseList
        filterType={filterType}
        filters={debouncedFilters}
        onEditExpense={handleEditExpense}
        onViewExpense={handleViewExpense}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nuevo Gasto"
        size="lg"
        glass
        glassBackdrop
        accentColor="239,68,68"
      >
        <ExpenseForm
          onSubmit={handleCreateExpense}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createExpenseMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!expenseToEdit}
        onClose={() => setExpenseToEdit(null)}
        title="Editar Gasto"
        size="lg"
        showCloseButton={false}
      >
        {expenseToEdit && (
          <ExpenseForm
            expense={expenseToEdit}
            onSubmit={handleUpdateExpense}
            onCancel={() => setExpenseToEdit(null)}
            isLoading={updateExpenseMutation.isPending}
          />
        )}
      </Modal>
    </div>
    </>
  );
};

export default ExpensesPage;
