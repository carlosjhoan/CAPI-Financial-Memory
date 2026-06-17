import React from 'react';
import { cn } from '../../../core/utils/format';

export interface StepActionsProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onContinue: () => void;
  canContinue?: boolean;
  canSubmit?: boolean;
  disabled?: boolean;
  /** Full Tailwind classes for the checkmark button: text color + hover states */
  checkClassName: string;
  submitLabel?: string;
  continueLabel?: string;
}

const StepActions: React.FC<StepActionsProps> = ({
  currentStep,
  totalSteps,
  onBack,
  onContinue,
  canContinue = true,
  canSubmit,
  disabled = false,
  checkClassName,
  submitLabel = 'Enviar',
  continueLabel = 'Continuar',
}) => {
  const isLastStep = currentStep === totalSteps - 1;
  const canAct = isLastStep ? (canSubmit ?? canContinue) : canContinue;
  const buttonDisabled = disabled || !canAct;

  return (
    <div className="flex items-center justify-center gap-5 pt-6">
      {currentStep > 0 && (
        <button
          type="button"
          onClick={onBack}
          disabled={disabled}
          className="flex h-11 w-11 items-center justify-center rounded-full text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-secondary-700 dark:hover:text-secondary-300"
          aria-label="Atrás"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <button
        type={isLastStep ? 'submit' : 'button'}
        onClick={isLastStep ? undefined : onContinue}
        disabled={buttonDisabled}
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40',
          checkClassName,
        )}
        aria-label={isLastStep ? submitLabel : continueLabel}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </div>
  );
};

export default StepActions;
