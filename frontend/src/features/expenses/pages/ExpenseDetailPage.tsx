import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExpense, useUpdateExpense, useDeleteExpense } from '../hooks/useExpenses';
import { formatCurrency, formatDate, formatDateTime } from '../../../core/utils/format';
import Card, { CardContent, CardHeader } from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import DeleteExpenseModal from '../components/DeleteExpenseModal';
import ExpenseForm from '../components/ExpenseForm';
import Modal from '../../../shared/components/Modal';
import { ExpenseFormData } from '../hooks/useExpenseForm';

const ExpenseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: expense, isLoading, error } = useExpense(id || '');
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (data: ExpenseFormData) => {
    if (!expense) return;

    // Hook maneja error via onError callback - no duplicar toast aquí
    await updateExpenseMutation.mutateAsync({
      id: expense.id,
      data,
    });
    setIsEditModalOpen(false);
  };

  const handleDelete = async () => {
    if (!expense) return;

    // Hook maneja error via onError callback - no duplicar toast aquí
    await deleteExpenseMutation.mutateAsync(expense.id);
    navigate('/expenses');
  };

  const handleBack = () => {
    navigate('/expenses');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">
            Cargando gasto...
          </p>
        </div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
          <svg
            className="w-6 h-6 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
          {error ? 'Error al cargar gasto' : 'Gasto no encontrado'}
        </h3>
        <p className="text-secondary-600 dark:text-secondary-400 mb-4">
          {error instanceof Error ? error.message : 'El gasto solicitado no existe'}
        </p>
        <Button onClick={handleBack}>
          Volver a Gastos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Detalle de Gasto
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Información completa del gasto
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleBack}
          >
            Volver
          </Button>

          <Button
            variant="secondary"
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Editar
          </Button>

          <Button
            variant="danger"
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader
          title={formatCurrency(expense.amount)}
          description={expense.reason}
        />

        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Información Básica
                  </h3>

                  <dl className="mt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <dt className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                        Monto:
                      </dt>
                      <dd className="text-lg font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(expense.amount)}
                      </dd>
                    </div>

                    <div className="flex items-center justify-between">
                      <dt className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                        Motivo:
                      </dt>
                      <dd className="text-sm text-secondary-900 dark:text-white text-right">
                        {expense.reason}
                      </dd>
                    </div>

                    <div className="flex items-center justify-between">
                      <dt className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                        Fecha del gasto:
                      </dt>
                      <dd className="text-sm text-secondary-900 dark:text-white">
                        {formatDate(expense.date)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Metadatos
                  </h3>

                  <dl className="mt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <dt className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                        ID:
                      </dt>
                      <dd className="text-sm text-secondary-900 dark:text-white font-mono">
                        {expense.id}
                      </dd>
                    </div>

                    <div className="flex items-center justify-between">
                      <dt className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                        Creado:
                      </dt>
                      <dd className="text-sm text-secondary-900 dark:text-white">
                        {formatDateTime(expense.createdAt)}
                      </dd>
                    </div>

                    {expense.updatedAt && (
                      <div className="flex items-center justify-between">
                        <dt className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                          Actualizado:
                        </dt>
                        <dd className="text-sm text-secondary-900 dark:text-white">
                          {formatDateTime(expense.updatedAt)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
              <h3 className="text-sm font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-3">
                Resumen
              </h3>

              <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4">
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Este gasto fue registrado el {formatDate(expense.createdAt)} y
                  {expense.updatedAt && expense.updatedAt !== expense.createdAt
                    ? ` fue actualizado por última vez el ${formatDate(expense.updatedAt)}.`
                    : ' no ha sido modificado desde su creación.'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DeleteExpenseModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        expense={expense}
        onConfirm={handleDelete}
        isLoading={deleteExpenseMutation.isPending}
      />

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Gasto"
        size="lg"
        showCloseButton={false}
      >
        {expense && (
          <ExpenseForm
            expense={expense}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditModalOpen(false)}
            isLoading={updateExpenseMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
};

export default ExpenseDetailPage;
