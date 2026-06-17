import React from 'react';
import { cn } from '../../../core/utils/format';

export interface FormStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  currentLabel: string;
  barColor: string; // Tailwind class: "bg-red-500", "bg-green-500", etc.
}

const FormStepIndicator: React.FC<FormStepIndicatorProps> = ({
  currentStep,
  totalSteps,
  currentLabel,
  barColor,
}) => {
  return (
    <div className="mb-6 space-y-2">
      <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400">
        Paso {currentStep + 1} de {totalSteps}
        <span className="mx-1.5">·</span>
        {currentLabel}
      </p>
      <div className="h-1 overflow-hidden rounded-full bg-secondary-200 dark:bg-secondary-700">
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', barColor)}
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default FormStepIndicator;
