import React, { useId } from 'react';
import { cn } from '../../core/utils/format';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    fullWidth = false,
    id,
    ...props 
  }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className={cn('space-y-1', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-secondary-700 dark:text-secondary-300"
          >
            {label}
          </label>
        )}
        
        <div
          className={cn(
            'relative rounded-lg border transition-all duration-200',
            error
              ? 'border-red-300 focus-within:border-red-500 dark:border-red-600'
              : 'border-secondary-300 dark:border-secondary-600 focus-within:border-primary-500 dark:focus-within:border-primary-400',
            !error && 'focus-within:ring-0',
          )}
          style={{
            '--glow-rgb': error ? '239, 68, 68' : '99, 102, 241',
            boxShadow: `0 0 0 2px rgba(var(--glow-rgb), 0.4), 0 0 24px rgba(var(--glow-rgb), 0.2), 0 0 56px rgba(var(--glow-rgb), 0.12), 0 0 96px rgba(var(--glow-rgb), 0.06)`,
          } as React.CSSProperties}
        >
          <input
            ref={ref}
            type="date"
            id={inputId}
            className={cn(
              'block w-full rounded-lg border-0 bg-transparent px-3 py-2 cursor-pointer',
              'focus:outline-none focus:ring-0',
              'dark:text-white dark:[color-scheme:dark]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error 
                ? 'text-red-900 dark:text-red-100' 
                : 'text-secondary-900 dark:text-white',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
        </div>
        
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="text-sm text-secondary-500 dark:text-secondary-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;