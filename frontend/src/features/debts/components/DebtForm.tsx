import React, { useState } from 'react';
import type { Debt } from '../types/debt.types';
import { useDebtForm, type DebtFormData } from '../hooks/useDebtForm';
import {
  FormFloatCurrency,
  FormFloatInput,
  FormFloatDatePicker,
  FormStepIndicator,
  StepActions,
} from '../../../shared/components';
import { formatCurrency } from '../../../core/utils/format';

export interface DebtFormProps {
  debt?: Debt;
  onSubmit: (data: DebtFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const STEPS = [
  { label: '¿Cuánto debés?', fields: ['initialAmount', 'lender'] as const },
  { label: 'Plan de pagos', fields: ['months', 'installAmount'] as const },
  { label: 'Detalles', fields: ['date', 'reason'] as const },
];

const DebtForm: React.FC<DebtFormProps> = ({
  debt,
  onSubmit,
  isLoading = false,
}) => {
  const isEditMode = !!debt;
  const [currentStep, setCurrentStep] = useState<number>(0);

  const {
    handleSubmit,
    formState: { isSubmitting },
    watch,
    control,
    trigger,
  } = useDebtForm(
    debt
      ? {
          initialAmount: debt.initialAmount,
          lender: debt.lender,
          months: debt.months,
          installAmount: debt.installAmount,
          date: debt.date,
          reason: debt.reason,
        }
      : undefined,
    isEditMode,
  );

  const initialAmount = watch('initialAmount');
  const months = watch('months');
  const installAmount = watch('installAmount');

  const calculatedFinalAmount =
    installAmount && months ? installAmount * months : 0;

  const hasInconsistency =
    calculatedFinalAmount > 0 && initialAmount > 0
      ? calculatedFinalAmount < initialAmount
      : false;

  const isLastStep = currentStep === STEPS.length - 1;

  const validateStep = async (): Promise<boolean> => {
    const stepFields = STEPS[currentStep].fields;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return trigger(stepFields as any);
  };

  const handleContinue = async () => {
    if (isLastStep) {
      handleSubmit(handleFormSubmit)();
      return;
    }

    const valid = await validateStep();
    if (!valid) return;

    setCurrentStep((s) => s + 1);
  };

  const handleGoBack = () => {
    setCurrentStep((s) => s - 1);
  };

  const handleFormSubmit = async (data: DebtFormData) => {
    await onSubmit(data);
  };

  const canContinue = !isLoading && !isSubmitting;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormStepIndicator
        currentStep={currentStep}
        totalSteps={STEPS.length}
        currentLabel={STEPS[currentStep].label}
        barColor="bg-orange-500"
      />

      {/* ═══ Step content ═══ */}
      <div className="space-y-6">
        {currentStep === 0 && (
          <>
            <FormFloatCurrency
              name="initialAmount"
              control={control}
              label="Monto Inicial"
              fullWidth
              required
              accent="debt"
            />

            <FormFloatInput
              name="lender"
              control={control}
              label="Acreedor"
              helperText="Nombre de la entidad o persona que prestó el dinero"
              fullWidth
              required
              disabled={isLoading || isSubmitting}
              accent="debt"
            />
          </>
        )}

        {currentStep === 1 && (
          <>
            <FormFloatInput
              name="months"
              control={control}
              label="Número de Meses"
              type="number"
              fullWidth
              required
              disabled={isLoading || isSubmitting}
              accent="debt"
            />

            <FormFloatCurrency
              name="installAmount"
              control={control}
              label="Monto de Cuota"
              helperText="Monto mensual a pagar"
              fullWidth
              required
              emitOnChange
              accent="debt"
            />

            {/* Monto Final Calculado */}
            {installAmount && months && (
              <div
                className={`rounded-lg border p-4 transition-colors ${
                  hasInconsistency
                    ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20'
                    : 'border-secondary-200 bg-secondary-50 dark:border-secondary-700 dark:bg-secondary-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                      Monto Final Calculado:
                    </span>
                    {hasInconsistency && (
                      <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-xs font-medium">Inconsistente</span>
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-lg font-bold ${
                      hasInconsistency
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(calculatedFinalAmount)}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {currentStep === 2 && (
          <>
            <FormFloatDatePicker
              name="date"
              control={control}
              label="Fecha"
              fullWidth
              required={!isEditMode}
              disabled={isEditMode || isLoading || isSubmitting}
              accent="debt"
            />

            <FormFloatInput
              name="reason"
              control={control}
              label="Motivo de la Deuda"
              fullWidth
              disabled={isLoading || isSubmitting}
              accent="debt"
            />
          </>
        )}
      </div>

      <StepActions
        currentStep={currentStep}
        totalSteps={STEPS.length}
        onBack={handleGoBack}
        onContinue={handleContinue}
        canContinue={canContinue}
        disabled={isLoading || isSubmitting}
        checkClassName="text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
        submitLabel={debt ? 'Actualizar Deuda' : 'Crear Deuda'}
      />
    </form>
  );
};

export default DebtForm;
