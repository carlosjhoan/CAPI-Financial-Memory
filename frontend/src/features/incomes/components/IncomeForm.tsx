import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Income } from '../types/income.types';
import { useIncomeForm, type IncomeFormData } from '../hooks/useIncomeForm';
import { usePockets } from '../../pockets/hooks/usePockets';
import { incomesService } from '../../../core/api';
import { formatCurrency } from '../../../core/utils/format';
import {
  FormFloatCurrency,
  FormFloatInput,
  FormFloatDatePicker,
  FloatSelect,
  FloatCurrency,
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
  onCancel,
  isLoading = false,
  initialPocketId,
}) => {
  const queryClient = useQueryClient();
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
    replace,
    trigger,
  } = useIncomeForm(
    income
      ? { amount: income.amount, reason: '', date: income.date }
      : undefined,
    isEditMode,
  );

  const { data: pockets } = usePockets();
  const amount = watch('amount') || 0;
  const allocations = watch('allocations') || [];
  const totalAllocated = allocations.reduce((sum, alloc) => sum + (alloc.amount || 0), 0);
  const remaining = amount - totalAllocated;

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
      replace([{
        pocketId: initialPocketId || '',
        amount,
      }]);
    }
  }, [allocationMode, fields.length, replace, amount, initialPocketId, isEditMode]);

  const isLastStep = currentStep === STEPS.length - 1;

  const validateStep = async (): Promise<boolean> => {
    const fields = STEPS[currentStep].fields;
    if (fields.length === 0) return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return trigger(fields as any);
  };

  const handleContinue = async () => {
    if (isLastStep) {
      await handleSubmit(handleFormSubmit)();
      return;
    }

    const valid = await validateStep();
    if (!valid) return;

    setCurrentStep((s) => s + 1);
  };

  const handleGoBack = () => {
    setCurrentStep((s) => s - 1);
  };

  // ─── Adjustment mode (edit) ───
  const handleAdjustment = async () => {
    if (!income) return;
    const newAmount = watch('amount');
    const newReason = watch('reason');
    if (!newAmount || newAmount <= 0) return;
    if (!newReason || newReason.trim().length < 20) {
      trigger('reason');
      return;
    }

    await incomesService.createAdjustment(income.id, {
      amount: newAmount,
      reason: newReason,
    });
    queryClient.invalidateQueries({ queryKey: ['incomes'] });
    queryClient.invalidateQueries({ queryKey: ['pockets'] });
    onCancel?.();
  };

  const handleFormSubmit = async (data: IncomeFormData) => {
    await onSubmit(data);
  };

  const canSubmit =
    !isLoading &&
    !isSubmitting &&
    Math.abs(remaining) > 0.001 === false;

  const canContinue = !isLoading && !isSubmitting;

  // ─── Adjustment mode (edit) — simplified form ───
  if (isEditMode) {
    const currentAmount = income!.amount;
    const newAmount = watch('amount') || 0;
    const delta = newAmount - currentAmount;
    const deltaSign = delta >= 0 ? '+' : '';

    return (
      <form onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
        <div className="space-y-6">
          <style>{`@keyframes fadeSlide{from{opacity:.3;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}`}</style>
          {/* Current → Delta → Adjusted */}
          <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800/50 p-4">
            <div className="grid grid-cols-3 gap-4 text-center items-center">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary-500 dark:text-secondary-400 mb-1">
                  Valor actual
                </p>
                <p className="text-lg font-bold text-secondary-900 dark:text-white">
                  +{formatCurrency(currentAmount)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary-500 dark:text-secondary-400 mb-1">
                  AJUSTE
                </p>
                <div className="flex items-center justify-center gap-1">
                  {delta > 0 ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                    </svg>
                  ) : delta < 0 ? (
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 13.5L12 21m0 0l7.5-7.5M12 21V3" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  )}
                  <span key={delta} style={{ animation: 'fadeSlide 200ms ease-out' }} className={`text-base font-bold ${delta > 0 ? 'text-green-500' : delta < 0 ? 'text-red-500' : 'text-secondary-500'}`}>
                    {formatCurrency(Math.abs(delta))}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary-500 dark:text-secondary-400 mb-1">
                  Valor ajustado
                </p>
                <p key={newAmount} style={{ animation: 'fadeSlide 200ms ease-out' }} className="text-lg font-bold text-green-600 dark:text-green-400">
                  +{formatCurrency(newAmount)}
                </p>
              </div>
            </div>
          </div>

          <FormFloatCurrency
            name="amount"
            control={control}
            label="Nuevo monto"
            fullWidth
            required
            accent="income"
            glass
            emitOnChange
          />

          <FormFloatInput
            name="reason"
            control={control}
            label="Motivo del ajuste"
            helperText="Explicá por qué ajustas este ingreso"
            fullWidth
            required
            disabled={isLoading || isSubmitting}
            accent="income"
            maxLength={100}
            glass
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-full border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAdjustment}
            disabled={isLoading || isSubmitting}
            className="flex-1 px-4 py-2 rounded-full text-sm font-semibold
              bg-gradient-to-r from-green-500/10 to-emerald-500/10
              dark:from-green-500/20 dark:to-emerald-500/20
              border border-green-300/30 dark:border-green-400/30
              text-green-600 dark:text-green-300
              hover:from-green-500/20 hover:to-emerald-500/20
              hover:border-green-300/60 dark:hover:border-green-400/60
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-300"
          >
            Ajustar Ingreso
          </button>
        </div>
      </form>
    );
  }

  return (
      <form onKeyDown={(e) => {
        if (e.key === 'Enter' && !isLastStep) e.preventDefault();
      }}>
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
              maxLength={100}
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
            accent="income"
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
                    ? 'bg-green-500 text-white'
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
                    ? 'bg-green-500 text-white'
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
                accent="income"
              />
            )}

            {/* Multiple mode: field array con montos */}
            {allocationMode === 'multiple' && (
              <>
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
                ))}

                {errors.allocations?.message && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400" role="alert">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    {errors.allocations.message}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => append({ pocketId: '', amount: 0 })}
                  className="flex items-center justify-center w-10 h-10 rounded-lg border border-dashed border-secondary-300 dark:border-secondary-600 text-secondary-500 hover:text-green-500 hover:border-green-500 dark:hover:text-green-400 dark:hover:border-green-400 transition-colors"
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
        checkClassName="text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
        submitLabel={income ? 'Actualizar Ingreso' : 'Crear Ingreso'}
      />
    </form>
  );
};

export default IncomeForm;
