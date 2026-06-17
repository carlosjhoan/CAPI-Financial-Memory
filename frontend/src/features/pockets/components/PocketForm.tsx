import React, { useState } from 'react';
import type { Pocket } from '../types/pocket.types';
import { usePocketForm, type PocketFormData } from '../hooks/usePocketForm';
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

const STEPS = [
  { label: 'Identidad', fields: ['name', 'motivation'] as const },
  { label: 'Tipo y meta', fields: ['type', 'goal', 'accumulatedAmount'] as const },
];

const PocketForm: React.FC<PocketFormProps> = ({
  pocket,
  onSubmit,
  isLoading = false,
}) => {
  const isEditMode = !!pocket;
  const [currentStep, setCurrentStep] = useState<number>(0);

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

  const isLastStep = currentStep === STEPS.length - 1;

  const validateStep = async (): Promise<boolean> => {
    const stepFields = STEPS[currentStep].fields;
    return trigger(stepFields as unknown as any[]);
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

  const canContinue = !isLoading && !isSubmitting;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormStepIndicator
        currentStep={currentStep}
        totalSteps={STEPS.length}
        currentLabel={STEPS[currentStep].label}
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

            <FormFloatCurrency
              name="accumulatedAmount"
              control={control}
              label="Monto de apertura"
              helperText="Monto inicial (puede ser 0)"
              fullWidth
              required
              accent="pocket"
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
        checkClassName="text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20"
        submitLabel={isEditMode ? 'Actualizar Bolsillo' : 'Crear Bolsillo'}
      />
    </form>
  );
};

export default PocketForm;
