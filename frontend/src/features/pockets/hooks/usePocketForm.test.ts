import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePocketForm } from './usePocketForm';

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
  });
});
