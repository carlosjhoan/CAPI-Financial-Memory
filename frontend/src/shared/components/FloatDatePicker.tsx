import React, { useState, useId } from 'react';
import { cn } from '../../core/utils/format';
import { FORM_ACCENT, type FormAccent } from '../utils/formAccent';

export interface FloatDatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'placeholder'> {
  label: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  accent?: FormAccent;
}

const FloatDatePicker = React.forwardRef<HTMLInputElement, FloatDatePickerProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      fullWidth = false,
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

    const hasValue = value !== undefined && value !== '';
    const isFloating = isFocused || hasValue;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
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
          <input
            ref={ref}
            type="date"
            id={inputId}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder=" "
            className={cn(
              'block w-full rounded-lg border-0 bg-transparent',
              'px-3 pb-2 pt-5 pr-10 text-secondary-900 dark:text-white dark:[color-scheme:dark]',
              '[&::-webkit-calendar-picker-indicator]:opacity-0',
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
          />

          {/* ── Calendar icon con accent color ── */}
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center pr-3">
            <svg
              className={cn('w-4 h-4', error ? 'text-red-500' : accentCls.label)}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
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

FloatDatePicker.displayName = 'FloatDatePicker';

export default FloatDatePicker;
