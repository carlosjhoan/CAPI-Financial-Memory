import React, { useState, useId } from 'react';
import { cn } from '../../core/utils/format';
import { Option } from '../../core/types/common.types';
import { FORM_ACCENT, type FormAccent } from '../utils/formAccent';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Option[];
  placeholder?: string;
  fullWidth?: boolean;
  accent?: FormAccent;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    options,
    placeholder,
    fullWidth = false,
    accent = 'primary',
    id,
    ...props 
  }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const [isFocused, setIsFocused] = useState(false);
    const accentCls = FORM_ACCENT[accent];

    return (
      <div className={cn('space-y-1', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={selectId}
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
              : `border-secondary-300 dark:border-secondary-600 ${accentCls.border}`,
            isFocused && !error && 'ring-0',
          )}
          style={{
            '--glow-rgb': error ? '239, 68, 68' : accentCls.glowRGB,
            ...(error || isFocused ? {
              boxShadow: `0 0 0 2px rgba(var(--glow-rgb), 0.4), 0 0 24px rgba(var(--glow-rgb), 0.2), 0 0 56px rgba(var(--glow-rgb), 0.12), 0 0 96px rgba(var(--glow-rgb), 0.06)`,
            } : {}),
          } as React.CSSProperties}
        >
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'block w-full rounded-lg border-0 bg-transparent px-3 py-2',
              'focus:outline-none focus:ring-0',
              'dark:bg-secondary-800 dark:text-white dark:[color-scheme:dark]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error 
                ? 'text-red-900 dark:text-red-100' 
                : 'text-secondary-900 dark:text-white',
              fullWidth ? 'w-full' : '',
              className
            )}
            onFocus={(e) => { setIsFocused(true); props.onFocus?.(e); }}
            onBlur={(e) => { setIsFocused(false); props.onBlur?.(e); }}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            {...props}
          >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        </div>
        
        {error && (
          <p
            id={`${selectId}-error`}
            className="text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p
            id={`${selectId}-helper`}
            className="text-sm text-secondary-500 dark:text-secondary-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;