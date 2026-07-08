import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePocketForm, pocketSchema } from './usePocketForm';

describe('usePocketForm', () => {
  describe('toCreateDto', () => {
    it('includes sourceType when provided', () => {
      const { result } = renderHook(() => usePocketForm());
      const dto = result.current.toCreateDto({
        name: 'Vacaciones',
        type: 'goal',
        goal: 100000,
        accumulatedAmount: 5000,
        motivation: 'Para viajar',
        sourceType: 'external',
      });
      expect(dto.sourceType).toBe('external');
    });

    it('omits sourceType when not provided', () => {
      const { result } = renderHook(() => usePocketForm());
      const dto = result.current.toCreateDto({
        name: 'Vacaciones',
        type: 'goal',
        goal: 100000,
        accumulatedAmount: 0,
        motivation: 'Para viajar',
      });
      expect(dto.sourceType).toBeUndefined();
    });

    it('includes sourceType when set to transfer', () => {
      const { result } = renderHook(() => usePocketForm());
      const dto = result.current.toCreateDto({
        name: 'Ahorro',
        type: 'deposit',
        goal: 0,
        accumulatedAmount: 5000,
        motivation: 'Ahorrar',
        sourceType: 'transfer',
      });
      expect(dto.sourceType).toBe('transfer');
    });

    it('includes sourcePocketId in DTO when sourceType is transfer', () => {
      const { result } = renderHook(() => usePocketForm());
      const dto = result.current.toCreateDto({
        name: 'Ahorro',
        type: 'deposit',
        goal: 0,
        accumulatedAmount: 5000,
        motivation: 'Ahorrar',
        sourceType: 'transfer',
        sourcePocketId: 'pocket-123',
      });
      expect(dto.sourcePocketId).toBe('pocket-123');
    });

    it('omits sourcePocketId in DTO when sourceType is external', () => {
      const { result } = renderHook(() => usePocketForm());
      const dto = result.current.toCreateDto({
        name: 'Ahorro',
        type: 'deposit',
        goal: 0,
        accumulatedAmount: 5000,
        motivation: 'Ahorrar',
        sourceType: 'external',
        sourcePocketId: 'pocket-123',
      });
      expect(dto.sourcePocketId).toBeUndefined();
    });
  });

  describe('schema validation', () => {
    it('requires sourcePocketId when sourceType is transfer', () => {
      const result = pocketSchema.safeParse({
        name: 'Test',
        type: 'goal',
        goal: 1000,
        accumulatedAmount: 500,
        motivation: 'Save',
        sourceType: 'transfer',
        sourcePocketId: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const srcErr = result.error.issues.find((i) => i.path[0] === 'sourcePocketId');
        expect(srcErr).toBeDefined();
      }
    });

    it('passes validation without sourcePocketId when sourceType is external', () => {
      const result = pocketSchema.safeParse({
        name: 'Test Pocket',
        type: 'goal',
        goal: 1000,
        accumulatedAmount: 500,
        motivation: 'Save for a trip to Paris!',
        sourceType: 'external',
      });
      expect(result.success).toBe(true);
    });
  });
});
