import React, { useEffect, useState } from 'react';
import type { Income } from '../types/income.types';
import { useIncomeForm, type IncomeFormData } from '../hooks/useIncomeForm';
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

export interface IncomeFormProps {
  income?: Income;
  onSubmit: (data: IncomeFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  initialPocketId?: string;
}

const STEPS = [
  { label: '¿Cuánto entró?', fields: ['amount', 'reason'] as const },
  { label: '¿Cuándo?', fields: ['date'] as const },
  { label: '¿A qué bolsillo?', fields: [] as readonly string[] },
];

const IncomeForm: React.FC<IncomeFormProps> = ({
  income,
  onSubmit,
  isLoading = false,
  initialPocketId,
}) => {
  const isEditMode = !!income;
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
  } = useIncomeForm(
    income
      ? { amount: income.amount, reason: income.reason, date: income.date }
      : undefined,
    isEditMode,
  );

  // Inicializar con pocketId si se pasa desde PocketDetailPage
  useEffect(() => {
    if (initialPocketId && !isEditMode && fields.length === 0) {
      append({ pocketId: initialPocketId, amount: 0 });
    }
  }, [initialPocketId, isEditMode, fields.length, append]);

  const { data: pockets } = usePockets();
  const amount = watch('amount') || 0;
  const allocations = watch('allocations') || [];
  const totalAllocated = allocations.reduce((sum, alloc) => sum + (alloc.amount || 0), 0);
  const remaining = amount - totalAllocated;

  const isLastStep = currentStep === STEPS.length - 1;

  const validateStep = async (): Promise<boolean> => {
    const fields = STEPS[currentStep].fields;
    if (fields.length === 0) return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return trigger(fields as any);
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

  const handleFormSubmit = async (data: IncomeFormData) => {
    await onSubmit(data);
  };

  const canSubmit =
    !isLoading &&
    !isSubmitting &&
    Math.abs(remaining) > 0.001 === false;

  const canContinue = !isLoading && !isSubmitting;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormStepIndicator
        currentStep={currentStep}
        totalSteps={STEPS.length}
        currentLabel={STEPS[currentStep].label}
        barColor="bg-green-500"
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
              accent="income"
            />

            <FormFloatInput
              name="reason"
              control={control}
              label="Motivo"
              helperText="Ej: Salario mensual, Venta de producto, etc."
              fullWidth
              required
              disabled={isLoading || isSubmitting}
              accent="income"
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
            accent="income"
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
              <div key={field.id} className="flex gap-2 items-start">
                <div className="flex-1">
                  <FloatSelect
                    label="Bolsillo"
                    value={allocations[index]?.pocketId}
                    onChange={(e) =>
                      setValue(`allocations.${index}.pocketId`, e.target.value, {
                        shouldValidate: true,
                      })
                    }
                    options={pockets?.map((p) => ({ label: p.name, value: p.id })) || []}
                    fullWidth
                    accent="income"
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
                  accent="income"
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
            ))}

            {errors.allocations?.message && (
              <p className="text-sm text-red-500">{errors.allocations.message}</p>
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
        checkClassName="text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
        submitLabel={income ? 'Actualizar Ingreso' : 'Crear Ingreso'}
      />
    </form>
  );
};

export default IncomeForm;
