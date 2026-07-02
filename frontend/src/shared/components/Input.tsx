import React, { useId } from 'react';
import { cn } from '../../core/utils/format';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    fullWidth = false,
    leftIcon,
    rightIcon,
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
          style={!error ? {
            '--glow-rgb': '99, 102, 241',
            boxShadow: `0 0 0 2px rgba(var(--glow-rgb, 99, 102, 241), 0.4), 0 0 24px rgba(var(--glow-rgb, 99, 102, 241), 0.2), 0 0 56px rgba(var(--glow-rgb, 99, 102, 241), 0.12), 0 0 96px rgba(var(--glow-rgb, 99, 102, 241), 0.06)`,
          } as React.CSSProperties : undefined}
        >
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full rounded-lg border-0 bg-transparent px-3 py-2',
              'focus:outline-none focus:ring-0',
              'dark:text-white dark:[color-scheme:dark]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error 
                ? 'text-red-900 dark:text-red-100' 
                : 'text-secondary-900 dark:text-white',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input';

export default Input;