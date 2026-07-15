import React, { useState, useEffect, useMemo } from 'react';
import type { Pocket } from '../types/pocket.types';
import { usePocketForm, type PocketFormData } from '../hooks/usePocketForm';
import { usePockets } from '../hooks/usePockets';
import {
  FormFloatInput,
  FormFloatCurrency,
  FormStepIndicator,
  StepActions,
} from '../../../shared/components';

export interface PocketFormProps {
  pocket?: Pocket;
  onSubmit: (data: PocketFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const CREATE_STEPS = [
  { label: 'Identidad', fields: ['name', 'motivation'] as const },
  { label: 'Tipo', fields: ['type'] as const },
  { label: 'Apertura', fields: ['accumulatedAmount'] as const },
];

const EDIT_STEPS = CREATE_STEPS.slice(0, 2);

const PocketForm: React.FC<PocketFormProps> = ({
  pocket,
  onSubmit,
  isLoading = false,
}) => {
  const isEditMode = !!pocket;
  const [currentStep, setCurrentStep] = useState<number>(0);
  const steps = isEditMode ? EDIT_STEPS : CREATE_STEPS;

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    control,
    trigger,
  } = usePocketForm(
    pocket
      ? {
          name: pocket.name,
          type: pocket.type,
          goal: pocket.goal,
          accumulatedAmount: pocket.accumulatedAmount,
          motivation: pocket.motivation,
        }
      : undefined,
  );

  const pocketType = watch('type');
  const accumulatedAmount = watch('accumulatedAmount');
  const sourceType = watch('sourceType');
  const nameValue = watch('name');
  const motivationValue = watch('motivation');

  const { data: pocketsData } = usePockets();

  const eligiblePockets = (pocketsData ?? []).filter(
    (p) => p.accumulatedAmount >= (accumulatedAmount || 0),
  );

  const isLastStep = currentStep === steps.length - 1;

  // Auto-default sourceType to 'external' when accumulatedAmount becomes positive in create mode.
  // Clear sourceType when amount goes back to 0.
  useEffect(() => {
    if (!isEditMode) {
      if (accumulatedAmount > 0 && !sourceType) {
        setValue('sourceType', 'external', { shouldValidate: true });
      } else if (accumulatedAmount === 0 && sourceType) {
        setValue('sourceType', undefined, { shouldValidate: true });
      }
    }
  }, [accumulatedAmount, isEditMode, sourceType, setValue]);

  // Per-step validation for canContinue
  const stepValid = useMemo(() => {
    if (currentStep === 0) {
      return (nameValue?.length ?? 0) > 5 && (motivationValue?.length ?? 0) > 5;
    }
    return true;
  }, [currentStep, nameValue, motivationValue]);

  const validateStep = async (): Promise<boolean> => {
    const stepFields = steps[currentStep].fields;
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

  const handleFormSubmit = async (data: PocketFormData) => {
    await onSubmit(data);
  };

  const canContinue = !isLoading && !isSubmitting && stepValid;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormStepIndicator
        currentStep={currentStep}
        totalSteps={steps.length}
        currentLabel={steps[currentStep].label}
        barColor="bg-purple-500"
      />

      {/* ═══ Step content ═══ */}
      <div className="space-y-6">
        {currentStep === 0 && (
          <>
            <FormFloatInput
              name="name"
              control={control}
              label="Nombre del Bolsillo"
              fullWidth
              required
              disabled={isLoading || isSubmitting}
              accent="pocket"
              maxLength={50}
            />

            <FormFloatInput
              name="motivation"
              control={control}
              label="Motivación"
              helperText="¿Por qué creás este bolsillo?"
              fullWidth
              required
              disabled={isLoading || isSubmitting}
              accent="pocket"
              maxLength={100}
            />
          </>
        )}

        {currentStep === 1 && (
          <>
            {/* Type Selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Tipo de Bolsillo <span className="text-red-500">*</span>
              </label>
              {errors.type?.message && (
                <p className="mb-2 text-xs text-red-600 dark:text-red-400" role="alert">
                  {errors.type.message}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('type', 'goal', { shouldValidate: true })}
                  disabled={isLoading || isSubmitting}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                    pocketType === 'goal'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                      : 'border-secondary-200 bg-white text-secondary-600 hover:border-purple-300 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-400 dark:hover:border-purple-600'
                  }`}
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  <span className="text-sm font-medium">Bolsillo Objetivo</span>
                  <span className="text-center text-xs text-secondary-500 dark:text-secondary-400">
                    Con meta de ahorro
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('type', 'deposit', { shouldValidate: true })}
                  disabled={isLoading || isSubmitting}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                    pocketType === 'deposit'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                      : 'border-secondary-200 bg-white text-secondary-600 hover:border-purple-300 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-400 dark:hover:border-purple-600'
                  }`}
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium">Bolsillo Depósito</span>
                  <span className="text-center text-xs text-secondary-500 dark:text-secondary-400">
                    Sin meta, solo depósitos
                  </span>
                </button>
              </div>
            </div>

            {/* Goal field (only for goal type) */}
            {pocketType === 'goal' && (
              <FormFloatCurrency
                name="goal"
                control={control}
                label="Meta / Objetivo"
                helperText="Monto total que deseás alcanzar"
                fullWidth
                required
                accent="pocket"
              />
            )}

            {/* Info text when deposit type */}
            {pocketType === 'deposit' && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex items-start gap-3">
                  <svg
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Sin meta definida
                    </p>
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      Este bolsillo no tiene una meta de ahorro. Solo se mostrará el valor acumulado.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {currentStep === 2 && (
          <>
            <FormFloatCurrency
              name="accumulatedAmount"
              control={control}
              label="Monto de apertura"
              helperText="Monto inicial (puede ser 0)"
              emitOnChange
              fullWidth
              required
              accent="pocket"
            />

            {/* Source selector — only in create mode when accumulatedAmount > 0 */}
            {!isEditMode && accumulatedAmount > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  Origen del dinero <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue('sourceType', 'external', { shouldValidate: true })}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                      sourceType === 'external'
                        ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                        : 'border-secondary-200 bg-white text-secondary-600 hover:border-purple-300 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-400 dark:hover:border-purple-600'
                    }`}
                  >
                    <span className="text-sm font-medium">Dinero nuevo</span>
                    <span className="text-center text-xs text-secondary-500 dark:text-secondary-400">
                      Ingreso externo a tu patrimonio
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setValue('sourceType', 'transfer', { shouldValidate: true })}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                      sourceType === 'transfer'
                        ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                        : 'border-secondary-200 bg-white text-secondary-600 hover:border-purple-300 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-400 dark:hover:border-purple-600'
                    }`}
                  >
                    <span className="text-sm font-medium">Viene de otro bolsillo</span>
                    <span className="text-center text-xs text-secondary-500 dark:text-secondary-400">
                      Transferencia desde otro bolsillo
                    </span>
                  </button>
                </div>

                {/* Pocket selector dropdown — shown only when sourceType === 'transfer' */}
                {sourceType === 'transfer' && (
                  <div className="mt-3">
                    <label
                      htmlFor="sourcePocketId"
                      className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300"
                    >
                      Bolsillo de origen <span className="text-red-500">*</span>
                    </label>
                    {eligiblePockets.length > 0 ? (
                      <select
                        id="sourcePocketId"
                        onChange={(e) =>
                          setValue('sourcePocketId', e.target.value, {
                            shouldValidate: true,
                          })
                        }
                        defaultValue=""
                        disabled={isLoading || isSubmitting}
                        className="block w-full rounded-lg border border-secondary-300 bg-white px-4 py-2.5 text-sm text-secondary-900 focus:border-purple-500 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-secondary-600 dark:bg-secondary-800 dark:text-secondary-100 dark:[color-scheme:dark] dark:focus:border-purple-400"
                      >
                        <option value="" disabled>
                          Seleccioná un bolsillo...
                        </option>
                        {eligiblePockets.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — ${Number(p.accumulatedAmount).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        No hay bolsillos con fondos suficientes
                      </p>
                    )}
                    {errors.sourcePocketId?.message && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
                        {errors.sourcePocketId.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <StepActions
        currentStep={currentStep}
        totalSteps={steps.length}
        onBack={handleGoBack}
        onContinue={handleContinue}
        canContinue={canContinue}
        disabled={isLoading || isSubmitting}
        checkClassName="text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20"
        submitLabel={isEditMode ? 'Actualizar Bolsillo' : 'Crear Bolsillo'}
      />
    </form>
  );
};

export default PocketForm;
