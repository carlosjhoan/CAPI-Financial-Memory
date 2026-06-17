import React, { useState, useId } from 'react';
import { cn } from '../../core/utils/format';
import { FORM_ACCENT, type FormAccent } from '../utils/formAccent';

export interface FloatSelectOption {
  value: string;
  label: string;
}

export interface FloatSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'placeholder'> {
  label: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: FloatSelectOption[];
  placeholder?: string;
  accent?: FormAccent;
}

const FloatSelect = React.forwardRef<HTMLSelectElement, FloatSelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      fullWidth = false,
      options,
      placeholder = 'Seleccionar',
      accent = 'primary',
      id,
      value,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const accentCls = FORM_ACCENT[accent];
    const [isFocused, setIsFocused] = useState(false);

    const hasValue = value !== undefined && value !== '' && value !== '__placeholder__';
    const isFloating = isFocused || hasValue;

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        <style>{`
          @keyframes glowPulse {
            0%, 100% { box-shadow: 0 0 0 2px rgba(var(--glow-rgb, 99, 102, 241), 0.3), 0 0 12px rgba(var(--glow-rgb, 99, 102, 241), 0.15), 0 0 24px rgba(var(--glow-rgb, 99, 102, 241), 0.08); }
            50% { box-shadow: 0 0 0 2px rgba(var(--glow-rgb, 99, 102, 241), 0.5), 0 0 24px rgba(var(--glow-rgb, 99, 102, 241), 0.25), 0 0 48px rgba(var(--glow-rgb, 99, 102, 241), 0.15), 0 0 80px rgba(var(--glow-rgb, 99, 102, 241), 0.08); }
          }
        `}</style>
        <div
          className={cn(
            'relative rounded-lg border transition-all duration-200',
            error
              ? 'border-red-300 focus-within:border-red-500 dark:border-red-600'
              : `border-secondary-300 dark:border-secondary-600 ${accentCls.border}`,
            isFocused &&
              (error
                ? 'ring-2 ring-red-500/30'
                : 'animate-[glowPulse_2s_ease-in-out_infinite]'),
          )}
          style={(isFocused && !error) ? { '--glow-rgb': accentCls.glowRGB } as React.CSSProperties : undefined}
        >
          <select
            ref={ref}
            id={inputId}
            value={value ?? '__placeholder__'}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              'block w-full rounded-lg border-0 bg-transparent',
              'px-3 pb-2 pt-5 text-secondary-900 dark:text-white',
              'appearance-none',
              'transition-all duration-200',
              'focus:outline-none focus:ring-0',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          >
            <option value="__placeholder__" disabled>
              {placeholder}
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="text-secondary-900 dark:bg-secondary-800 dark:text-secondary-100">
                {opt.label}
              </option>
            ))}
          </select>

          {/* Chevron */}
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center pr-3">
            <svg
              className="h-4 w-4 text-secondary-500 dark:text-secondary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <label
            htmlFor={inputId}
            className={cn(
              'pointer-events-none absolute left-3 z-10 origin-[0] transition-all duration-200',
              !isFloating && 'top-1/2 -translate-y-1/2 text-sm',
              isFloating &&
                '-top-2.5 text-xs bg-white px-1 dark:bg-secondary-800',
              // ── Color: always explicit ──
              'text-secondary-500 dark:text-secondary-400',
              isFocused &&
                (error
                  ? 'text-red-500 dark:text-red-400'
                  : accentCls.label),
              !isFocused &&
                error &&
                'text-red-500 dark:text-red-400',
            )}
          >
            {label}
            {props.required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-xs text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-xs text-secondary-500 dark:text-secondary-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

FloatSelect.displayName = 'FloatSelect';

export default FloatSelect;
