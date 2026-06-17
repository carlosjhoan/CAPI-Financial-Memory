import React, { useState, useEffect, useId } from 'react';
import { cn } from '../../core/utils/format';
import { parseCurrencyCOP } from '../utils/currency';

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: number;
  onChange?: (value: number) => void;
  currency?: string;
  fullWidth?: boolean;
  decimals?: number; // Número de decimales (por defecto 2)
  emitOnChange?: boolean; // Emitir valor mientras se escribe (antes de blur)
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ 
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
    ...props 
  }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Inicializar displayValue cuando cambia el value prop
    useEffect(() => {
      if (value !== undefined && !isFocused) {
        // Formatear el valor para mostrar cuando no está enfocado
        // IMPORTANTE: No usar formatCurrencyCOP porque incluye el signo $
        // que ya se muestra fuera del input. Solo formatear con puntos como separador de miles
        let formatted: string;
        
        if (currency === 'COP') {
          // Formatear solo con separadores de miles (sin $)
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
      // Cuando se enfoca, mostrar el valor numérico sin formato
      // IMPORTANTE: Para COP, convertir el punto decimal a coma
      // porque parseCurrencyCOP interpreta punto como separador de miles
      if (value !== undefined) {
        let focusedValue: string;
        
        if (currency === 'COP') {
          // Convertir a string y asegurar que decimales usen coma
          focusedValue = value === 0 
            ? '0' 
            : value.toString().replace(/\./g, ',');
        } else {
          focusedValue = value === 0 ? '0' : value.toString();
        }
        
        setDisplayValue(focusedValue);
      }
      
      // Seleccionar todo el texto para facilitar la edición
      setTimeout(() => {
        e.target.select();
      }, 0);
      
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      
      // Cuando pierde el foco, formatear el valor
      if (displayValue.trim() === '') {
        // Si está vacío pero ya tenemos un valor anterior, mantenerlo
        if (value !== undefined && onChange) {
          // No hacer cambios, mantener el valor existente
        } else if (onChange) {
          onChange(0);
        }
        // No formatear como 0 si estaba vacío
      } else {
        // Parsear el valor actual y actualizar el value prop
        const numericValue = currency === 'COP' 
          ? parseCurrencyCOP(displayValue)
          : parseFloat(displayValue.replace(/[^\d.-]/g, ''));
        
        // SOLO llamar onChange si el valor realmente cambió
        // Esto previene re-renders innecesarios que pueden causar el bug
        // de valores duplicados cuando el usuario hace focus → blur sin cambios
        if (!isNaN(numericValue) && onChange && numericValue !== value) {
          onChange(numericValue);
        }
      }
      
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Si está vacío, permitir borrar
      if (inputValue === '') {
        setDisplayValue('');
        if (emitOnChange && onChange) {
          onChange(0);
        }
        return;
      }
      
      // Formatear el input mientras el usuario escribe
      if (currency === 'COP') {
        // Para COP, permitir números, punto, coma y eliminar otros caracteres
        inputValue = inputValue.replace(/[^\d,.]/g, '');
        
        // Manejar múltiples separadores decimales
        const hasDot = inputValue.includes('.');
        const hasComma = inputValue.includes(',');
        
        if (hasDot && hasComma) {
          // Mantener solo el último separador decimal
          const lastDot = inputValue.lastIndexOf('.');
          const lastComma = inputValue.lastIndexOf(',');
          
          if (lastDot > lastComma) {
            inputValue = inputValue.replace(/,/g, '');
          } else {
            inputValue = inputValue.replace(/\./g, '');
          }
        }
        
        // Limitar a 2 decimales después del separador
        const separator = inputValue.includes(',') ? ',' : '.';
        const parts = inputValue.split(separator);
        if (parts.length > 1 && parts[1].length > 2) {
          inputValue = parts[0] + separator + parts[1].slice(0, 2);
        }
      } else {
        // Para otras monedas, permitir solo números y un punto decimal
        inputValue = inputValue.replace(/[^\d.]/g, '');
        
        // Asegurar que solo haya un punto decimal
        const parts = inputValue.split('.');
        if (parts.length > 2) {
          inputValue = parts[0] + '.' + parts.slice(1).join('');
        }
        
        // Limitar a 2 decimales
        if (parts.length > 1 && parts[1].length > 2) {
          inputValue = parts[0] + '.' + parts[1].slice(0, 2);
        }
      }
      
      setDisplayValue(inputValue);
      
      // Emitir valor en tiempo real si emitOnChange está habilitado
      if (emitOnChange && onChange && inputValue.trim() !== '') {
        const numericValue = currency === 'COP' 
          ? parseCurrencyCOP(inputValue)
          : parseFloat(inputValue.replace(/[^\d.-]/g, ''));
        
        if (!isNaN(numericValue)) {
          onChange(numericValue);
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permitir navegación con teclas de flecha, tab, etc.
      if (
        e.key === 'ArrowLeft' || 
        e.key === 'ArrowRight' || 
        e.key === 'ArrowUp' || 
        e.key === 'ArrowDown' ||
        e.key === 'Tab' ||
        e.key === 'Home' ||
        e.key === 'End' ||
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Enter' ||
        e.ctrlKey || 
        e.metaKey
      ) {
        return;
      }
      
      // Permitir solo dígitos, punto, coma y signo menos
      if (!/[\d.,-]/.test(e.key)) {
        e.preventDefault();
      }
    };

    const getCurrencySymbol = () => {
      switch (currency) {
        case 'COP':
          return '$';
        case 'EUR':
          return '€';
        case 'USD':
          return '$';
        default:
          return currency;
      }
    };

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
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
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
            className={cn(
              'block rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-800 dark:text-white',
              'disabled:cursor-not-allowed disabled:bg-secondary-100 disabled:text-secondary-500 dark:disabled:bg-secondary-700 dark:disabled:text-secondary-400',
              'pl-0 ml-8',
              error 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600' 
                : 'border-secondary-300 dark:border-secondary-600',
              fullWidth ? 'w-full' : '',
              'px-3 py-2',
              className
            )}
            disabled={disabled}
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

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;