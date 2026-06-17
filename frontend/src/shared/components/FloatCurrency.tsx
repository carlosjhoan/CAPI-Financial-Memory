import React, { useState, useEffect, useId, useCallback } from 'react';
import { cn } from '../../core/utils/format';
import { parseCurrencyCOP } from '../utils/currency';
import { FORM_ACCENT, type FormAccent } from '../utils/formAccent';

export interface FloatCurrencyProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'placeholder'> {
  label: string;
  error?: string;
  helperText?: string;
  value?: number;
  onChange?: (value: number) => void;
  currency?: string;
  fullWidth?: boolean;
  decimals?: number;
  emitOnChange?: boolean;
  accent?: FormAccent;
}

const FloatCurrency = React.forwardRef<HTMLInputElement, FloatCurrencyProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      value,
      onChange,
      currency = 'COP',
      fullWidth = false,
      decimals = 2,
      emitOnChange = false,
      id,
      disabled,
      onFocus,
      onBlur,
      accent = 'primary',
      ...props
    },
    ref,
  ) => {
    const accentCls = FORM_ACCENT[accent];
    const generatedId = useId();
    const inputId = id || generatedId;
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const hasTransientValue = displayValue !== '';
    const isFloating = isFocused || (value !== undefined && value > 0) || hasTransientValue;

    const getCurrencySymbol = useCallback(() => {
      switch (currency) {
        case 'COP': return '$';
        case 'EUR': return '€';
        case 'USD': return '$';
        default: return currency;
      }
    }, [currency]);

    useEffect(() => {
      if (value !== undefined && !isFocused) {
        let formatted: string;

        if (currency === 'COP') {
          const multiplier = Math.pow(10, decimals);
          const rounded = Math.round(value * multiplier) / multiplier;
          const [integerPart, decimalPart] = rounded.toFixed(decimals).split('.');
          const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          formatted = decimals > 0 && decimalPart
            ? `${formattedInteger},${decimalPart}`
            : formattedInteger;
        } else {
          formatted = new Intl.NumberFormat('es-ES', {
            style: 'decimal',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(value);
        }
        setDisplayValue(formatted);
      }
    }, [value, currency, isFocused, decimals]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (value !== undefined) {
        let focusedValue: string;
        if (currency === 'COP') {
          focusedValue = value === 0 ? '0' : value.toString().replace(/\./g, ',');
        } else {
          focusedValue = value === 0 ? '0' : value.toString();
        }
        setDisplayValue(focusedValue);
      }
      setTimeout(() => { e.target.select(); }, 0);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      if (displayValue.trim() === '') {
        if (value !== undefined && onChange) {
          // keep existing value
        } else if (onChange) {
          onChange(0);
        }
      } else {
        const numericValue = currency === 'COP'
          ? parseCurrencyCOP(displayValue)
          : parseFloat(displayValue.replace(/[^\d.-]/g, ''));

        if (!isNaN(numericValue) && onChange && numericValue !== value) {
          onChange(numericValue);
        }
      }

      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;

      if (inputValue === '') {
        setDisplayValue('');
        if (emitOnChange && onChange) onChange(0);
        return;
      }

      if (currency === 'COP') {
        inputValue = inputValue.replace(/[^\d,.]/g, '');

        const hasDot = inputValue.includes('.');
        const hasComma = inputValue.includes(',');

        if (hasDot && hasComma) {
          const lastDot = inputValue.lastIndexOf('.');
          const lastComma = inputValue.lastIndexOf(',');
          if (lastDot > lastComma) {
            inputValue = inputValue.replace(/,/g, '');
          } else {
            inputValue = inputValue.replace(/\./g, '');
          }
        }

        const separator = inputValue.includes(',') ? ',' : '.';
        const parts = inputValue.split(separator);
        if (parts.length > 1 && parts[1].length > 2) {
          inputValue = parts[0] + separator + parts[1].slice(0, 2);
        }
      } else {
        inputValue = inputValue.replace(/[^\d.]/g, '');

        const parts = inputValue.split('.');
        if (parts.length > 2) {
          inputValue = parts[0] + '.' + parts.slice(1).join('');
        }

        if (parts.length > 1 && parts[1].length > 2) {
          inputValue = parts[0] + '.' + parts[1].slice(0, 2);
        }
      }

      setDisplayValue(inputValue);

      if (emitOnChange && onChange && inputValue.trim() !== '') {
        const numericValue = currency === 'COP'
          ? parseCurrencyCOP(inputValue)
          : parseFloat(inputValue.replace(/[^\d.-]/g, ''));
        if (!isNaN(numericValue)) onChange(numericValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
        e.key === 'Tab' || e.key === 'Home' || e.key === 'End' ||
        e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Enter' ||
        e.ctrlKey || e.metaKey
      ) return;

      if (!/[\d.,-]/.test(e.key)) e.preventDefault();
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
          {/* Currency symbol */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
            <span className="text-secondary-500 dark:text-secondary-400">
              {getCurrencySymbol()}
            </span>
          </div>

          <input
            ref={ref}
            type="text"
            id={inputId}
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            inputMode="decimal"
            placeholder=" "
            className={cn(
              'block w-full rounded-lg border-0 bg-transparent',
              'px-3 pb-2 pt-5 pl-10 text-secondary-900 dark:text-white',
              'transition-all duration-200',
              'focus:outline-none focus:ring-0',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />

          <label
            htmlFor={inputId}
            className={cn(
              'pointer-events-none absolute left-10 z-10 origin-[0] transition-all duration-200',
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

FloatCurrency.displayName = 'FloatCurrency';

export default FloatCurrency;
