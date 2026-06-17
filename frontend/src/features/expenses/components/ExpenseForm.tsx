import React, { useMemo, useState } from 'react';
import type { Expense } from '../types/expense.types';
import { useExpenseForm, type ExpenseFormData } from '../hooks/useExpenseForm';
import { usePockets } from '../../pockets/hooks/usePockets';
import {
  FormFloatCurrency,
  FormFloatInput,
  FormFloatDatePicker,
  FloatSelect,
  FloatCurrency,
  Button,
  FormStepIndicator,
  StepActions,
} from '../../../shared/components';

export interface ExpenseFormProps {
  expense?: Expense;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const STEPS = [
  { label: '¿Cuánto gastaste?', fields: ['amount', 'reason'] as const },
  { label: '¿Cuándo?', fields: ['date'] as const },
  { label: '¿De qué bolsillo?', fields: [] as readonly string[] },
];

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  expense,
  onSubmit,
  isLoading = false,
}) => {
  const isEditMode = !!expense;
  const [currentStep, setCurrentStep] = useState(0);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    control,
    fields,
    append,
    remove,
    trigger,
  } = useExpenseForm(
    expense
      ? {
          amount: expense.amount,
          reason: expense.reason,
          date: expense.date,
        }
      : undefined,
    isEditMode,
  );

  const { data: pockets } = usePockets();
  const amount = watch('amount') || 0;
  const allocations = watch('allocations') || [];
  const totalAllocated = allocations.reduce((sum, alloc) => sum + (alloc.amount || 0), 0);
  const remaining = amount - totalAllocated;

  // ─── Golden Rule: ningún bolsillo puede quedar en negativo ───
  const allocationErrors = useMemo((): Record<number, string> => {
    const errs: Record<number, string> = {};
    if (!pockets) return errs;

    allocations.forEach((alloc, index) => {
      if (!alloc.pocketId || !alloc.amount) return;
      const pocket = pockets.find((p) => p.id === alloc.pocketId);
      if (pocket && alloc.amount > pocket.accumulatedAmount) {
        errs[index] =
          `Fondos insuficientes en "${pocket.name}". Disponible: $${pocket.accumulatedAmount.toFixed(2)}`;
      }
    });

    return errs;
  }, [allocations, pockets]);

  const hasAllocationErrors = Object.keys(allocationErrors).length > 0;
  const isLastStep = currentStep === STEPS.length - 1;

  const validateStep = async (): Promise<boolean> => {
    const fields = STEPS[currentStep].fields;
    if (fields.length === 0) return true;
    return trigger(fields as any[]);
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

  const handleFormSubmit = async (data: ExpenseFormData) => {
    await onSubmit(data);
  };

  const canSubmit =
    !isLoading &&
    !isSubmitting &&
    Math.abs(remaining) > 0.001 === false &&
    !hasAllocationErrors;

  const canContinue = !isLoading && !isSubmitting;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormStepIndicator
        currentStep={currentStep}
        totalSteps={STEPS.length}
        currentLabel={STEPS[currentStep].label}
        barColor="bg-red-500"
      />

      {/* ═══ Step content ═══ */}
      <div className="space-y-6">
        {currentStep === 0 && (
          <>
            <FormFloatCurrency
              name="amount"
              control={control}
              label="Monto"
              fullWidth
              required
              accent="expense"
            />

            <FormFloatInput
              name="reason"
              control={control}
              label="Motivo"
              helperText="Ej: Comida, Transporte, etc."
              fullWidth
              required
              disabled={isLoading || isSubmitting}
              accent="expense"
            />
          </>
        )}

        {currentStep === 1 && (
          <FormFloatDatePicker
            name="date"
            control={control}
            label="Fecha"
            fullWidth
            required
            disabled={isLoading || isSubmitting}
            accent="expense"
          />
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-secondary-900 dark:text-white">
                Asignaciones
              </h3>
              <span
                className={`text-sm ${remaining < 0 ? 'text-red-500' : 'text-secondary-500'}`}
              >
                Restante: ${remaining.toFixed(2)}
              </span>
            </div>

            {fields.map((field, index) => (
              <div key={field.id}>
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <FloatSelect
                      label="Bolsillo"
                      value={allocations[index]?.pocketId}
                      onChange={(e) =>
                        setValue(`allocations.${index}.pocketId`, e.target.value, {
                          shouldValidate: true,
                        })
                      }
                      options={
                        pockets?.map((p) => ({ label: p.name, value: p.id })) || []
                      }
                      fullWidth
                      accent="expense"
                    />
                  </div>

                  <div className="w-36 flex-shrink-0">
                    <FloatCurrency
                      label="Monto"
                      value={allocations[index]?.amount}
                      onChange={(value) =>
                        setValue(`allocations.${index}.amount`, value, {
                          shouldValidate: true,
                        })
                      }
                      fullWidth
                      accent="expense"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => remove(index)}
                    className="mt-5 flex-shrink-0"
                  >
                    X
                  </Button>
                </div>

                {allocationErrors[index] && (
                  <p className="mt-1 text-xs text-orange-600 dark:text-orange-400" role="alert">
                    {allocationErrors[index]}
                  </p>
                )}
              </div>
            ))}

            {errors.allocations?.message && (
              <p className="text-sm text-red-500">{errors.allocations.message}</p>
            )}

            {hasAllocationErrors && (
              <div className="rounded-md border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Al menos un bolsillo no tiene fondos suficientes para cubrir la asignación.
                  Reducí el monto asignado o elegí otro bolsillo.
                </p>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ pocketId: '', amount: 0 })}
            >
              + Añadir Asignación
            </Button>
          </div>
        )}
      </div>

      <StepActions
        currentStep={currentStep}
        totalSteps={STEPS.length}
        onBack={handleGoBack}
        onContinue={handleContinue}
        canContinue={canContinue}
        canSubmit={canSubmit}
        disabled={isLoading || isSubmitting}
        checkClassName="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        submitLabel={expense ? 'Actualizar Gasto' : 'Crear Gasto'}
      />
    </form>
  );
};

export default ExpenseForm;
