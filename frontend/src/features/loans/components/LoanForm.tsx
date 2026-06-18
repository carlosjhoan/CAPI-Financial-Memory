import React, { useState } from 'react';
import type { Loan } from '../types/loan.types';
import { useLoanForm, type LoanFormData } from '../hooks/useLoanForm';
import {
  FormFloatCurrency,
  FormFloatInput,
  FormFloatDatePicker,
  FormStepIndicator,
  StepActions,
} from '../../../shared/components';
import { formatCurrency } from '../../../core/utils/format';

export interface LoanFormProps {
  loan?: Loan;
  onSubmit: (data: LoanFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const STEPS = [
  { label: '¿Cuánto prestás?', fields: ['initialAmount', 'interestRate'] as const },
  { label: 'Plan de pagos', fields: ['installment', 'debtor'] as const },
  { label: '¿Cuándo?', fields: ['date'] as const },
];

const LoanForm: React.FC<LoanFormProps> = ({
  loan,
  onSubmit,
  isLoading = false,
}) => {
  const isEditMode = !!loan;
  const [currentStep, setCurrentStep] = useState<number>(0);

  const {
    handleSubmit,
    formState: { isSubmitting },
    watch,
    control,
    trigger,
  } = useLoanForm(
    loan
      ? {
          initialAmount: loan.initialAmount,
          interestRate: loan.interestRate,
          installment: loan.installment,
          debtor: loan.debtor,
          date: loan.date,
        }
      : undefined,
    isEditMode,
  );

  const initialAmount = watch('initialAmount');
  const interestRate = watch('interestRate');

  const estimatedTotal =
    initialAmount && interestRate !== undefined
      ? initialAmount * (1 + interestRate / 100)
      : 0;

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

  const handleFormSubmit = async (data: LoanFormData) => {
    await onSubmit(data);
  };

  const canContinue = !isLoading && !isSubmitting;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormStepIndicator
        currentStep={currentStep}
        totalSteps={STEPS.length}
        currentLabel={STEPS[currentStep].label}
        barColor="bg-blue-500"
      />

      {/* ═══ Step content ═══ */}
      <div className="space-y-6">
        {currentStep === 0 && (
          <>
            {!isEditMode && (
              <FormFloatCurrency
                name="initialAmount"
                control={control}
                label="Monto Inicial"
                fullWidth
                required
                accent="loan"
              />
            )}

            <FormFloatInput
              name="interestRate"
              control={control}
              label="Tasa de Interés (%)"
              helperText="Porcentaje de interés anual (ej: 5.5 = 5.5%)"
              type="number"
              fullWidth
              required
              disabled={isLoading || isSubmitting}
              accent="loan"
            />

            {/* Monto Total Estimado */}
            {initialAmount > 0 && interestRate !== undefined && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                    Monto Total Estimado:
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(estimatedTotal)}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {currentStep === 1 && (
          <>
            <FormFloatCurrency
              name="installment"
              control={control}
              label="Cuota Mensual"
              helperText="Monto que el deudor pagará cada mes"
              fullWidth
              required
              emitOnChange
              accent="loan"
            />

            <FormFloatInput
              name="debtor"
              control={control}
              label="Deudor"
              helperText="Nombre de la persona que recibió el préstamo"
              fullWidth
              required
              disabled={isLoading || isSubmitting}
              accent="loan"
            />
          </>
        )}

        {currentStep === 2 && (
          <FormFloatDatePicker
            name="date"
            control={control}
            label="Fecha"
            fullWidth
            required
            disabled={isLoading || isSubmitting}
            accent="loan"
          />
        )}
      </div>

      <StepActions
        currentStep={currentStep}
        totalSteps={STEPS.length}
        onBack={handleGoBack}
        onContinue={handleContinue}
        canContinue={canContinue}
        disabled={isLoading || isSubmitting}
        checkClassName="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        submitLabel={loan ? 'Actualizar Préstamo' : 'Crear Préstamo'}
      />
    </form>
  );
};

export default LoanForm;
