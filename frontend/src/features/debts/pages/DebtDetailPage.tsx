import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDebt, useDeleteDebt, useUpdateDebt, useRegisterDebtPayment } from '../hooks/useDebts';
import { DebtFormData } from '../hooks/useDebtForm';
import DeleteDebtModal from '../components/DeleteDebtModal';
import PaymentModal from '../components/PaymentModal';
import DebtForm from '../components/DebtForm';
import Button from '../../../shared/components/Button';
import Card, { CardContent, CardHeader } from '../../../shared/components/Card';
import Modal from '../../../shared/components/Modal';
import { formatCurrency, formatDate } from '../../../core/utils/format';

const DebtDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: debt, isLoading, error } = useDebt(id || '');
  const deleteDebtMutation = useDeleteDebt();
  const updateDebtMutation = useUpdateDebt();
  const registerPaymentMutation = useRegisterDebtPayment();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = async () => {
    if (!id) return;
    await deleteDebtMutation.mutateAsync(id);
    navigate('/debts');
  };

  const handlePaymentSubmit = async (data: { debtId: string; amount: number; date?: string }) => {
    await registerPaymentMutation.mutateAsync(data);
    setIsPaymentModalOpen(false);
  };

  const handleUpdateDebt = async (data: DebtFormData) => {
    if (!id) return;

    // Hook maneja error via onError callback - no duplicar toast aquí
    // Extraer solo campos de UpdateDebtDto (sin date, el backend lo rechaza)
    const { date: _date, ...updateData } = data;
    await updateDebtMutation.mutateAsync({ id, data: updateData });
    setIsEditModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">
            Cargando detalles de la deuda...
          </p>
        </div>
      </div>
    );
  }

  if (error || !debt) {
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
          Error al cargar deuda
        </h3>
        <p className="text-secondary-600 dark:text-secondary-400 mb-4">
          {error instanceof Error ? error.message : 'No se pudo cargar la deuda'}
        </p>
        <Button onClick={() => navigate('/debts')}>
          Volver a Deudas
        </Button>
      </div>
    );
  }

  const remainingAmount = debt.finalAmount - debt.paidAmount;
  const progressPercentage = debt.finalAmount > 0
    ? Math.min((debt.paidAmount / debt.finalAmount) * 100, 100)
    : 0;
  const isFullyPaid = remainingAmount <= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/debts')}
            className="flex items-center gap-2 mb-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Deudas
          </Button>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            {debt.lender}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Editar
          </Button>
          {!isFullyPaid && (
            <Button
              variant="outline"
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Registrar Pago
            </Button>
          )}
          <Button
            variant="danger"
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </Button>
        </div>
      </div>

      {/* Reason */}
      <div className="mb-4">
        <span className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Motivo:</span>
        <p className="text-secondary-900 dark:text-white mt-1">{debt.reason}</p>
      </div>

      {/* Deuda Details */}
      <Card>
        <CardHeader title="Detalles de la Deuda" />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amount Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white border-b border-secondary-200 dark:border-secondary-700 pb-2">
                Información Financiera
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">Monto Inicial:</span>
                  <span className="font-semibold text-secondary-900 dark:text-white">
                    {formatCurrency(debt.initialAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">Número de Meses:</span>
                  <span className="font-semibold text-secondary-900 dark:text-white">
                    {debt.months}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">Monto de Cuota:</span>
                  <span className="font-semibold text-secondary-900 dark:text-white">
                    {formatCurrency(debt.installAmount)}/mes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">Monto Total:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(debt.finalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white border-b border-secondary-200 dark:border-secondary-700 pb-2">
                Estado de Pagos
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">Total Pagado:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(debt.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">Restante:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(remainingAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">Progreso:</span>
                  <span className="font-semibold text-secondary-900 dark:text-white">
                    {progressPercentage.toFixed(1)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-3 mt-2">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Date Info */}
          <div className="mt-6 pt-6 border-t border-secondary-200 dark:border-secondary-700">
            {isFullyPaid ? (
              <div className="flex items-center justify-center py-3">
                <span className="inline-flex items-center px-6 py-2 rounded-full text-xl font-bold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">
                  PAGADA
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">Fecha de Creación:</span>
                  <span className="text-secondary-900 dark:text-white">
                    {formatDate(debt.date)}
                  </span>
                </div>
                {debt.lastPaymentDate && (
                  <div className="flex justify-between">
                    <span className="text-secondary-600 dark:text-secondary-400">Último Pago:</span>
                    <span className="text-secondary-900 dark:text-white">
                      {formatDate(debt.lastPaymentDate)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payments History */}
      {debt.payments && debt.payments.length > 0 && (
        <Card>
          <CardHeader
            title="Historial de Pagos"
            description={`${debt.payments.length} pagos registrados`}
          />
          <CardContent>
            <div className="space-y-3">
              {debt.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex justify-between items-center p-3 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg"
                >
                  <div>
                    <span className="font-medium text-secondary-900 dark:text-white">
                      {formatCurrency(payment.amount)}
                    </span>
                    <span className="text-sm text-secondary-500 dark:text-secondary-400 ml-2">
                      {formatDate(payment.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <DeleteDebtModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        debt={debt}
        onConfirm={handleDelete}
        isLoading={deleteDebtMutation.isPending}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        debt={debt}
        onSubmit={handlePaymentSubmit}
        isLoading={registerPaymentMutation.isPending}
      />

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Deuda"
        size="lg"
        showCloseButton={false}
      >
        <DebtForm
          debt={debt}
          onSubmit={handleUpdateDebt}
          onCancel={() => setIsEditModalOpen(false)}
          isLoading={updateDebtMutation.isPending}
        />
      </Modal>
    </div>
  );
};

export default DebtDetailPage;
