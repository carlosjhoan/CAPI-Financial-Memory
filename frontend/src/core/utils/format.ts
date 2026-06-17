import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  // Usar formato colombiano para COP
  // Formato: $1.000.000 o $1.000.000,00
  if (isNaN(amount)) {
    return '$0';
  }

  // Redondear a 2 decimales
  const roundedAmount = Math.round(amount * 100) / 100;
  
  // Separar parte entera y decimal
  const [integerPart, decimalPart] = roundedAmount.toFixed(2).split('.');
  
  // Formatear parte entera con separadores de miles
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Construir el resultado
  return `$${formattedInteger},${decimalPart}`;
}

/**
 * Parse a date string safely into a Date object.
 * - Timestamps with 'T' (e.g. "2026-04-27T20:49:18.061Z") → new Date() works correctly.
 * - Date-only strings (e.g. "2026-04-27") → parsed as LOCAL midnight,
 *   avoiding the UTC-midnight shift in negative timezones (UTC-5 Colombia).
 */
function parseDate(date: string | Date): Date {
  if (!date) return new Date(); // fallback para inputs undefined/null
  if (date instanceof Date) return date;
  if (typeof date === 'string' && date.includes('T')) {
    return new Date(date);
  }
  // Date-only ISO string ("YYYY-MM-DD") → parse as local date
  if (typeof date === 'string' && date.includes('-')) {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  // Fallback: intentar new Date directamente
  return new Date(date);
}

export function formatDate(date: string | Date): string {
  const dateObj = parseDate(date);
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

export function formatDateTime(date: string | Date): string {
  const dateObj = parseDate(date);
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

export function formatRelativeTime(date: string | Date): string {
  const dateObj = parseDate(date);
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'justo ahora';
  } else if (diffInMinutes < 60) {
    return `hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''}`;
  } else if (diffInHours < 24) {
    return `hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
  } else if (diffInDays < 7) {
    return `hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`;
  } else {
    return formatDate(dateObj);
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Array de nombres de meses en español
export const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Array de nombres de meses cortos en español (3 letras)
export const monthNamesShort = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

// Obtener el nombre del mes dado el número (1-12)
export function getMonthName(month: number): string {
  if (month < 1 || month > 12) return '';
  return monthNames[month - 1];
}

// Obtener nombre corto del mes (3 letras) dado el número (1-12)
export function getMonthShortName(month: number): string {
  if (month < 1 || month > 12) return '';
  return monthNamesShort[month - 1];
}

// Formatear fecha YYYY-MM-DD a formato "YYYY-Mmm-DD"
// Ejemplo: "2026-04-01" -> "2026-Abr-01"
export function formatDateMonthShort(dateString: string): string {
  if (!dateString) return '';
  
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  
  const [, monthStr, dayStr] = parts;
  const month = parseInt(monthStr, 10);
  const monthShort = getMonthShortName(month);
  
  return `${parts[0]}-${monthShort}-${dayStr}`;
}

// Obtener el número del mes dado el nombre (soporta nombres completos o parciales)
export function getMonthNumber(monthName: string): number {
  if (!monthName) return 0;
  const lowerName = monthName.toLowerCase();
  // Buscar coincidencia al inicio del nombre
  const index = monthNames.findIndex(m => lowerName.startsWith(m.toLowerCase()));
  return index >= 0 ? index + 1 : 0;
}