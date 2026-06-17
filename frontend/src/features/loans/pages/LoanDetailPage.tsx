import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useLoan,
  useDeleteLoan,
  useUpdateLoan,
  useRegisterPayment,
  useLoanPerformance,
} from '../hooks/useLoans';
import { LoanFormData } from '../hooks/useLoanForm';
import DeleteLoanModal from '../components/DeleteLoanModal';
import RegisterPaymentModal from '../components/RegisterPaymentModal';
import LoanForm from '../components/LoanForm';
import Button from '../../../shared/components/Button';
import Card, { CardContent, CardHeader } from '../../../shared/components/Card';
import Modal from '../../../shared/components/Modal';
import { formatCurrency, formatDate } from '../../../core/utils/format';

const LoanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: loan, isLoading, error } = useLoan(id || '');
  const { data: performance } = useLoanPerformance(id || '');
  const deleteLoanMutation = useDeleteLoan();
  const updateLoanMutation = useUpdateLoan();
  const registerPaymentMutation = useRegisterPayment();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = async () => {
    if (!id) return;
    await deleteLoanMutation.mutateAsync(id);
    navigate('/loans');
  };

  const handlePaymentSubmit = async (data: { loanId: string; amount: number }) => {
    await registerPaymentMutation.mutateAsync(data);
    setIsPaymentModalOpen(false);
  };

  const handleUpdateLoan = async (data: LoanFormData) => {
    if (!id) return;

    await updateLoanMutation.mutateAsync({
      id,
      data: {
        interestRate: data.interestRate,
        installment: data.installment,
        debtor: data.debtor,
      },
    });
    setIsEditModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">
            Cargando detalles del préstamo...
          </p>
        </div>
      </div>
    );
  }

  if (error || !loan) {
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
          Error al cargar préstamo
        </h3>
        <p className="text-secondary-600 dark:text-secondary-400 mb-4">
          {error instanceof Error ? error.message : 'No se pudo cargar el préstamo'}
        </p>
        <Button onClick={() => navigate('/loans')}>
          Volver a Préstamos
        </Button>
      </div>
    );
  }

  const expectedReturn = loan.initialAmount * (1 + loan.interestRate / 100);
  const remainingAmount = loan.remainingAmount ?? expectedReturn - loan.paidAmount;
  const progressPercentage = expectedReturn > 0
    ? Math.min((loan.paidAmount / expectedReturn) * 100, 100)
    : 0;
  const isPaid = remainingAmount <= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/loans')}
            className="flex items-center gap-2 mb-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Préstamos
          </Button>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            {loan.debtor}
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
          {!isPaid && (
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

      {/* Loan Summary Card */}
      <Card>
        <CardHeader title="Resumen del Préstamo" />
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
                    {formatCurrency(loan.initialAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">Tasa de Interés:</span>
                  <span className="font-semibold text-secondary-900 dark:text-white">
                    {loan.interestRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">Cuota Mensual:</span>
                  <span className="font-semibold text-secondary-900 dark:text-white">
                    {formatCurrency(loan.installment)}/mes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">Retorno Esperado:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(expectedReturn)}
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
                  <span className="text-secondary-600 dark:text-secondary-400">Total Recibido:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(loan.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">Pendiente:</span>
                  <span className={`font-semibold ${isPaid ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
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
            <div className="flex justify-between">
              <span className="text-secondary-600 dark:text-secondary-400">Fecha del Préstamo:</span>
              <span className="text-secondary-900 dark:text-white">
                {formatDate(loan.date)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Section */}
      {performance && (
        <Card>
          <CardHeader
            title="Rendimiento del Préstamo"
            description="Análisis de cumplimiento de pagos"
          />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4 border border-secondary-200 dark:border-secondary-700">
                <p className="text-sm text-secondary-500 dark:text-secondary-400">Meses Transcurridos</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                  {performance.monthsSinceStart}
                </p>
              </div>
              <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4 border border-secondary-200 dark:border-secondary-700">
                <p className="text-sm text-secondary-500 dark:text-secondary-400">Pagos Esperados</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                  {performance.expectedPayments}
                </p>
              </div>
              <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4 border border-secondary-200 dark:border-secondary-700">
                <p className="text-sm text-secondary-500 dark:text-secondary-400">Pagos Recibidos</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {performance.actualPayments}
                </p>
              </div>
              <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4 border border-secondary-200 dark:border-secondary-700">
                <p className="text-sm text-secondary-500 dark:text-secondary-400">Ratio de Pago</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                  {(performance.paymentRatio * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4 border border-secondary-200 dark:border-secondary-700">
                <p className="text-sm text-secondary-500 dark:text-secondary-400">Estado</p>
                <p className={`text-2xl font-bold ${performance.isOnTrack ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {performance.isOnTrack ? 'Al día' : 'Atrasado'}
                </p>
              </div>
              <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4 border border-secondary-200 dark:border-secondary-700">
                <p className="text-sm text-secondary-500 dark:text-secondary-400">Meses de Atraso</p>
                <p className={`text-2xl font-bold ${performance.monthsBehind > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {performance.monthsBehind}
                </p>
              </div>
            </div>
            {performance.expectedCompletionDate && (
              <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">Fecha estimada de finalización:</span>
                  <span className="font-medium text-secondary-900 dark:text-white">
                    {formatDate(performance.expectedCompletionDate)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <DeleteLoanModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        loan={loan}
        onConfirm={handleDelete}
        isLoading={deleteLoanMutation.isPending}
      />

      <RegisterPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        loan={loan}
        onSubmit={handlePaymentSubmit}
        isLoading={registerPaymentMutation.isPending}
      />

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Préstamo"
        size="lg"
        showCloseButton={false}
      >
        <LoanForm
          loan={loan}
          onSubmit={handleUpdateLoan}
          onCancel={() => setIsEditModalOpen(false)}
          isLoading={updateLoanMutation.isPending}
        />
      </Modal>
    </div>
  );
};

export default LoanDetailPage;
