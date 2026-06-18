import { describe, it, expect } from 'vitest';
import { formatCurrencyCOP, parseCurrencyCOP, validateCurrencyCOP } from './currency';

describe('Currency utilities', () => {
  describe('formatCurrencyCOP', () => {
    it('should format whole numbers without decimals', () => {
      expect(formatCurrencyCOP(1000000)).toBe('$1.000.000');
      expect(formatCurrencyCOP(500)).toBe('$500');
      expect(formatCurrencyCOP(0)).toBe('$0');
    });

    it('should format numbers with decimals', () => {
      expect(formatCurrencyCOP(1000000.50, 2)).toBe('$1.000.000,50');
      expect(formatCurrencyCOP(1234.56, 2)).toBe('$1.234,56');
      expect(formatCurrencyCOP(99.99, 2)).toBe('$99,99');
    });

    it('should handle negative numbers', () => {
      expect(formatCurrencyCOP(-1000)).toBe('$-1.000');
      expect(formatCurrencyCOP(-1234.56, 2)).toBe('$-1.234,56');
    });

    it('should round to specified decimals', () => {
      expect(formatCurrencyCOP(1234.567, 2)).toBe('$1.234,57');
      expect(formatCurrencyCOP(1234.561, 2)).toBe('$1.234,56');
      expect(formatCurrencyCOP(1234.5, 0)).toBe('$1.235');
    });
  });

  describe('parseCurrencyCOP', () => {
    it('should parse formatted strings', () => {
      expect(parseCurrencyCOP('$1.000.000')).toBe(1000000);
      expect(parseCurrencyCOP('$1.000.000,50')).toBe(1000000.5);
      expect(parseCurrencyCOP('$1.234,56')).toBe(1234.56);
    });

    it('should handle strings without formatting', () => {
      expect(parseCurrencyCOP('1000000')).toBe(1000000);
      expect(parseCurrencyCOP('1234.56')).toBe(1234.56);
      expect(parseCurrencyCOP('1234,56')).toBe(1234.56);
    });

    it('should handle empty strings', () => {
      expect(parseCurrencyCOP('')).toBe(0);
      expect(parseCurrencyCOP('   ')).toBe(0);
    });

    it('should handle invalid strings', () => {
      expect(parseCurrencyCOP('abc')).toBeNaN();
      expect(parseCurrencyCOP('$abc')).toBeNaN();
    });
  });

  describe('validateCurrencyCOP', () => {
    it('should validate positive numbers', () => {
      expect(validateCurrencyCOP(1000)).toEqual({ isValid: true });
      expect(validateCurrencyCOP(0)).toEqual({ isValid: true });
      expect(validateCurrencyCOP(999999999.99)).toEqual({ isValid: true });
    });

    it('should reject negative numbers', () => {
      expect(validateCurrencyCOP(-1000)).toEqual({
        isValid: false,
        error: 'El monto no puede ser negativo'
      });
    });

    it('should reject numbers exceeding maximum', () => {
      expect(validateCurrencyCOP(1000000000)).toEqual({
        isValid: false,
        error: 'El monto no puede exceder $999.999.999,99'
      });
    });

    it('should validate formatted strings', () => {
      expect(validateCurrencyCOP('$1.000.000')).toEqual({ isValid: true });
      expect(validateCurrencyCOP('$1.000.000,50')).toEqual({ isValid: true });
    });

    it('should reject invalid strings', () => {
      expect(validateCurrencyCOP('abc')).toEqual({
        isValid: false,
        error: 'El monto no es un número válido'
      });
    });
  });
});