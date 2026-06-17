import React from 'react';
import { Loan } from '../types/loan.types';
import { formatCurrency } from '../../../core/utils/format';
import { usePaymentForm } from './usePaymentForm';
import {
  Modal,
  FormFloatCurrency,
  FormFloatDatePicker,
  StepActions,
} from '../../../shared/components';

export interface RegisterPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  onSubmit: (data: { loanId: string; amount: number }) => Promise<void>;
  isLoading?: boolean;
}

const RegisterPaymentModal: React.FC<RegisterPaymentModalProps> = ({
  isOpen,
  onClose,
  loan,
  onSubmit,
  isLoading = false,
}) => {
  const {
    handleSubmit,
    isSubmitting,
    setValue,
    control,
  } = usePaymentForm();

  const expectedReturn = loan
    ? loan.initialAmount * (1 + loan.interestRate / 100)
    : 0;
  const remainingAmount = loan ? (loan.remainingAmount ?? expectedReturn - loan.paidAmount) : 0;

  const handleFormSubmit = async (data: { amount: number }) => {
    if (!loan) return;
    await onSubmit({
      loanId: loan.id,
      amount: data.amount,
    });
    onClose();
  };

  if (!loan) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Pago"
      description={`Registro de pago de ${loan.debtor}`}
      size="md"
      glass
      glassBackdrop
      accentColor="59,130,246"
    >
      <div className="space-y-4">
        {/* Loan Info */}
        <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-4 dark:border-secondary-700 dark:bg-secondary-800/50">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Deudor:
              </span>
              <span className="text-lg font-semibold text-secondary-900 dark:text-white">
                {loan.debtor}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Monto Restante:
              </span>
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <FormFloatCurrency
            name="amount"
            control={control}
            label="Monto del Pago"
            helperText={`Monto restante: ${formatCurrency(remainingAmount)}`}
            required
            fullWidth
            accent="loan"
          />

          <div className="mb-4 flex items-center justify-center space-x-2">
            {/* Pagar Restante */}
            <button
              type="button"
              onClick={() => setValue('amount', remainingAmount, { shouldValidate: true })}
              disabled={isLoading || isSubmitting}
              className="group relative w-36 overflow-hidden rounded-lg border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-700 transition-all duration-300 ease-in-out hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-[0_0_12px_rgba(52,211,153,0.5)] dark:border-emerald-600 dark:text-emerald-300 dark:hover:border-emerald-400 dark:hover:bg-black dark:hover:shadow-[0_0_12px_rgba(52,211,153,0.5)]"
              aria-label="Pagar restante del préstamo"
            >
              <span className="transition-opacity duration-300 group-hover:opacity-0 group-hover:scale-95">
                Pagar Restante
              </span>
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center -translate-x-full transition-transform duration-300 ease-in-out group-hover:translate-x-0 text-emerald-500 dark:text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                </svg>
              </span>
            </button>

            {/* Una Cuota */}
            <button
              type="button"
              onClick={() => setValue('amount', loan.installment, { shouldValidate: true })}
              disabled={isLoading || isSubmitting}
              className="group relative w-28 overflow-hidden rounded-lg border border-purple-300 px-3 py-2 text-sm font-medium text-purple-700 transition-all duration-300 ease-in-out hover:border-purple-400 hover:bg-purple-50 hover:shadow-[0_0_12px_rgba(168,85,247,0.5)] dark:border-purple-600 dark:text-purple-300 dark:hover:border-purple-400 dark:hover:bg-black dark:hover:shadow-[0_0_12px_rgba(168,85,247,0.5)]"
              aria-label="Pagar una cuota"
            >
              <span className="transition-opacity duration-300 group-hover:opacity-0 group-hover:scale-95">
                Una Cuota
              </span>
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center -translate-x-full transition-transform duration-300 ease-in-out group-hover:translate-x-0 text-purple-500 dark:text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </span>
            </button>
          </div>

          <FormFloatDatePicker
            name="date"
            control={control}
            label="Fecha del Pago"
            required
            fullWidth
            accent="loan"
          />

          <StepActions
            currentStep={0}
            totalSteps={1}
            onBack={() => {}}
            onContinue={() => {}}
            canContinue={!isLoading && !isSubmitting}
            disabled={isLoading || isSubmitting}
            checkClassName="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            submitLabel="Registrar Pago"
          />
        </form>
      </div>
    </Modal>
  );
};

export default RegisterPaymentModal;
