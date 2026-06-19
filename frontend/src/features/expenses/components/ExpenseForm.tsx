import React, { useEffect, useMemo, useState } from 'react';
import type { Expense } from '../types/expense.types';
import { useExpenseForm, type ExpenseFormData } from '../hooks/useExpenseForm';
import { usePockets } from '../../pockets/hooks/usePockets';
import {
  FormFloatCurrency,
  FormFloatInput,
  FormFloatDatePicker,
  FloatSelect,
  FloatCurrency,
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
    replace,
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
  const rawAllocations = watch('allocations');
  const allocations = useMemo(() => rawAllocations ?? [], [rawAllocations]);
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

  const [allocationMode, setAllocationMode] = useState<'single' | 'multiple'>('single');

  // Re-validate allocations when remaining changes (clears stale refine error)
  useEffect(() => {
    if (allocationMode === 'multiple') {
      trigger('allocations');
    }
  }, [remaining, allocationMode, trigger]);

  const handleModeChange = (mode: 'single' | 'multiple') => {
    if (mode === allocationMode) return;
    if (mode === 'single') {
      const pocketId = fields[0]?.pocketId ?? '';
      replace([{ pocketId, amount }]);
    }
    setAllocationMode(mode);
  };

  // Auto-sync single-mode allocation amount to total
  useEffect(() => {
    if (allocationMode === 'single' && fields.length > 0) {
      setValue('allocations.0.amount', amount, { shouldValidate: true });
    }
  }, [amount, allocationMode, fields.length, setValue]);

  // Inicializar asignación única en modo single si no hay entries
  useEffect(() => {
    if (allocationMode === 'single' && fields.length === 0) {
      replace([{ pocketId: '', amount }]);
    }
  }, [allocationMode, fields.length, replace, amount]);

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
            disabled={isEditMode || isLoading || isSubmitting}
            accent="expense"
          />
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            {/* Toggle: único vs varios bolsillos */}
            <div className="inline-flex rounded-lg border border-secondary-300 dark:border-secondary-600 overflow-hidden">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  allocationMode === 'single'
                    ? 'bg-red-500 text-white'
                    : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700'
                }`}
                onClick={() => handleModeChange('single')}
              >
                Único bolsillo
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  allocationMode === 'multiple'
                    ? 'bg-red-500 text-white'
                    : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700'
                }`}
                onClick={() => handleModeChange('multiple')}
              >
                Varios bolsillos
              </button>
            </div>

            {/* Total / restante — solo en varios bolsillos (en único siempre es $0) */}
            {allocationMode === 'multiple' && (
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                ${amount.toFixed(2)}{' '}
                <span className={remaining < 0 ? 'text-red-500' : ''}>
                  · {remaining >= 0 ? `restan $${remaining.toFixed(2)}` : `exceden $${Math.abs(remaining).toFixed(2)}`}
                </span>
              </p>
            )}

            {/* Single mode: selector sin monto */}
            {allocationMode === 'single' && (
              <FloatSelect
                label="Bolsillo"
                value={allocations[0]?.pocketId ?? ''}
                onChange={(e) =>
                  setValue('allocations.0.pocketId', e.target.value, {
                    shouldValidate: true,
                  })
                }
                options={pockets?.map((p) => ({ label: p.name, value: p.id })) || []}
                fullWidth
                accent="expense"
              />
            )}

            {/* Multiple mode: field array con montos + golden rule */}
            {allocationMode === 'multiple' && (
              <>
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

                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="mt-5 flex-shrink-0 p-2 text-secondary-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                        aria-label="Eliminar asignación"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {allocationErrors[index] && (
                      <p className="mt-1 text-xs text-orange-600 dark:text-orange-400" role="alert">
                        {allocationErrors[index]}
                      </p>
                    )}
                  </div>
                ))}

                {errors.allocations?.message && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400" role="alert">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    {errors.allocations.message}
                  </div>
                )}

                {hasAllocationErrors && (
                  <div className="rounded-md border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Al menos un bolsillo no tiene fondos suficientes para cubrir la asignación.
                      Reducí el monto asignado o elegí otro bolsillo.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => append({ pocketId: '', amount: 0 })}
                  className="flex items-center justify-center w-10 h-10 rounded-lg border border-dashed border-secondary-300 dark:border-secondary-600 text-secondary-500 hover:text-red-500 hover:border-red-500 dark:hover:text-red-400 dark:hover:border-red-400 transition-colors"
                  aria-label="Añadir asignación"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </>
            )}
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
