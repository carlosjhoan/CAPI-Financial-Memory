import React, { useState, useId } from 'react';
import { cn } from '../../core/utils/format';
import { FORM_ACCENT, type FormAccent } from '../utils/formAccent';

export interface FloatInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  accent?: FormAccent;
  minLength?: number;
  glass?: boolean;
}

const FloatInput = React.forwardRef<HTMLInputElement, FloatInputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      fullWidth = false,
      leftIcon,
      accent = 'primary',
      glass = false,
      id,
      value,
      onFocus,
      onBlur,
      maxLength,
      minLength,
      ...props
    },
    ref,
  ) => {
    const accentCls = FORM_ACCENT[accent];
    const generatedId = useId();
    const inputId = id || generatedId;
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
        {/* The border lives on this outer wrapper so the label can "cut through" it */}
        <div
          className={cn(
            'relative rounded-lg border transition-all duration-200',
            glass && 'bg-white/50 backdrop-blur-lg shadow-sm dark:bg-secondary-800/50',
            error
              ? 'border-red-300 focus-within:border-red-500 dark:border-red-600'
              : `border-secondary-300 dark:border-secondary-600 ${accentCls.border}`,
            isFocused && !error && 'ring-0',
          )}
          style={{
            '--glow-rgb': error ? '239, 68, 68' : accentCls.glowRGB,
            boxShadow: (error || isFocused)
              ? `0 0 0 2px rgba(var(--glow-rgb), 0.4), 0 0 24px rgba(var(--glow-rgb), 0.2), 0 0 56px rgba(var(--glow-rgb), 0.12), 0 0 96px rgba(var(--glow-rgb), 0.06)`
              : undefined,
          } as React.CSSProperties}
        >
          <input
            ref={ref}
            id={inputId}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder=" "
            maxLength={maxLength}
            className={cn(
              'block w-full rounded-lg border-0 bg-transparent',
              'px-3 pb-2 pt-5 text-secondary-900 dark:text-white dark:[color-scheme:dark]',
              'transition-all duration-200',
              'focus:outline-none focus:ring-0',
              'autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)] dark:autofill:shadow-[inset_0_0_0px_1000px_rgb(30,41,59)]',
              leftIcon && 'pl-10',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
            disabled={props.disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />

          {/* Floating label that cuts through the top border */}
          <label
            htmlFor={inputId}
            className={cn(
              'pointer-events-none absolute left-3 z-10 origin-[0] transition-all duration-200',
              // Default: centered inside the input (placeholder-like)
              !isFloating && 'top-1/2 -translate-y-1/2 text-sm',
              // Floating: sits ON the border line, bg masks the border underneath
              isFloating &&
                '-top-2.5 text-xs bg-white px-1 dark:bg-secondary-800',
              // ── Color: always explicit to avoid black-on-dark in dark mode ──
              'text-secondary-500 dark:text-secondary-400',
              isFocused &&
                (error
                  ? 'text-red-500 dark:text-red-400'
                  : accentCls.label),
              !isFocused &&
                error &&
                'text-red-500 dark:text-red-400',
              leftIcon && 'left-10',
            )}
          >
            {label}
            {props.required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        </div>

        <div className="mt-1.5 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {error && (
              <p
                id={`${inputId}-error`}
                className="text-xs text-red-600 dark:text-red-400"
                role="alert"
              >
                {error}
              </p>
            )}

            {helperText && !error && (
              <p
                id={`${inputId}-helper`}
                className="text-xs text-secondary-500 dark:text-secondary-400"
              >
                {helperText}
              </p>
            )}
          </div>

          {maxLength !== undefined && (
            <p
              className={cn(
                'flex-shrink-0 text-xs',
                String(value ?? '').length > maxLength
                  ? 'text-red-500'
                  : (minLength !== undefined && String(value ?? '').length > 0 && String(value ?? '').length < minLength)
                    ? 'text-red-500'
                    : 'text-secondary-400 dark:text-secondary-500',
              )}
            >
              {String(value ?? '').length}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  },
);

FloatInput.displayName = 'FloatInput';

export default FloatInput;
