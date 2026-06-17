/**
 * Formatea un número como moneda colombiana (COP)
 * Formato: $1.000.000 o $1.000.000,50
 * 
 * @param amount - Monto a formatear
 * @param decimals - Número de decimales a mostrar (0-2)
 * @returns String formateado en pesos colombianos
 */
export function formatCurrencyCOP(amount: number, decimals: number = 0): string {
  if (isNaN(amount)) {
    return '$0';
  }

  // Redondear a los decimales especificados
  const roundedAmount = decimals > 0 
    ? Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals)
    : Math.round(amount);

  // Separar parte entera y decimal
  const [integerPart, decimalPart] = roundedAmount.toFixed(decimals).split('.');

  // Formatear parte entera con separadores de miles
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Construir el resultado
  let result = `$${formattedInteger}`;
  
  if (decimals > 0 && decimalPart) {
    result += `,${decimalPart.padEnd(decimals, '0')}`;
  }

  return result;
}

/**
 * Convierte un string formateado como COP a número
 * 
 * @param formattedValue - String formateado (ej: "$1.000.000,50")
 * @returns Número o NaN si no es válido
 */
export function parseCurrencyCOP(formattedValue: string): number {
  if (!formattedValue || formattedValue.trim() === '') {
    return 0;
  }

  // Remover símbolo de peso y espacios
  const cleanValue = formattedValue.replace(/[$\s]/g, '');

  // Reemplazar separadores de miles y decimales
  const normalizedValue = cleanValue
    .replace(/\./g, '')  // Eliminar puntos (separadores de miles)
    .replace(/,/g, '.'); // Reemplazar coma decimal por punto

  const parsed = parseFloat(normalizedValue);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Valida si un valor es un monto válido para COP
 * 
 * @param value - Valor a validar
 * @returns Objeto con validez y mensaje de error
 */
export function validateCurrencyCOP(value: number | string): {
  isValid: boolean;
  error?: string;
} {
  let numericValue: number;

  if (typeof value === 'string') {
    numericValue = parseCurrencyCOP(value);
    if (isNaN(numericValue)) {
      return {
        isValid: false,
        error: 'El monto no es un número válido'
      };
    }
  } else {
    numericValue = value;
  }

  if (numericValue < 0) {
    return {
      isValid: false,
      error: 'El monto no puede ser negativo'
    };
  }

  if (numericValue > 999999999.99) {
    return {
      isValid: false,
      error: 'El monto no puede exceder $999.999.999,99'
    };
  }

  return { isValid: true };
}

/**
 * Formatea un input de moneda mientras el usuario escribe
 * 
 * @param inputValue - Valor del input
 * @returns Valor formateado para mostrar
 */
export function formatCurrencyInput(inputValue: string): string {
  if (!inputValue) return '';

  // Permitir solo números, punto y coma
  const cleanValue = inputValue.replace(/[^\d,.]/g, '');

  // Manejar múltiples puntos decimales
  const parts = cleanValue.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }

  // Manejar múltiples comas decimales
  const commaParts = cleanValue.split(',');
  if (commaParts.length > 2) {
    return commaParts[0] + ',' + commaParts.slice(1).join('');
  }

  // Si hay tanto punto como coma, mantener solo el último separador decimal
  if (cleanValue.includes('.') && cleanValue.includes(',')) {
    const lastDot = cleanValue.lastIndexOf('.');
    const lastComma = cleanValue.lastIndexOf(',');
    
    if (lastDot > lastComma) {
      return cleanValue.replace(/,/g, '');
    } else {
      return cleanValue.replace(/\./g, '');
    }
  }

  return cleanValue;
}