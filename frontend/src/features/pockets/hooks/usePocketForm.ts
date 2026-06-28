import type { UseFormReturn } from 'react-hook-form';
import { useBaseForm } from '../../../shared/hooks/useBaseForm';
import { z } from 'zod';
import type { CreatePocketDto, UpdatePocketDto } from '../types/pocket.types';

const pocketSchema = z.object({
  name: z
    .string({ required_error: 'El nombre es requerido' })
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  type: z.enum(['goal', 'deposit'], {
    required_error: 'El tipo de bolsillo es requerido',
  }),
  goal: z
    .number({ required_error: 'La meta es requerida' })
    .min(0, 'La meta no puede ser negativa'),
  accumulatedAmount: z
    .number({ required_error: 'El valor acumulado es requerido' })
    .min(0, 'El valor acumulado no puede ser negativo'),
  motivation: z
    .string({ required_error: 'La motivación es requerida' })
    .min(1, 'La motivación es requerida')
    .max(100, 'La motivación no puede exceder 100 caracteres'),
  sourceType: z.enum(['external', 'transfer']).optional(),
});

export type PocketFormData = z.infer<typeof pocketSchema>;

interface UsePocketFormReturn extends UseFormReturn<PocketFormData> {
  toCreateDto: (data: PocketFormData) => CreatePocketDto;
  toUpdateDto: (data: PocketFormData) => UpdatePocketDto;
}

export function usePocketForm(defaultValues?: Partial<PocketFormData>): UsePocketFormReturn {
  const form = useBaseForm({
    schema: pocketSchema,
    defaultValues: {
      name: '',
      type: 'goal',
      goal: 0,
      accumulatedAmount: 0,
      motivation: '',
      ...defaultValues,
    },
  });

  const toCreateDto = (data: PocketFormData): CreatePocketDto => ({
    name: data.name,
    type: data.type,
    goal: data.type === 'goal' ? data.goal : 0,
    accumulatedAmount: data.accumulatedAmount,
    motivation: data.motivation,
    sourceType: data.sourceType,
  });

  const toUpdateDto = (data: PocketFormData): UpdatePocketDto => ({
    name: data.name,
    type: data.type,
    goal: data.type === 'goal' ? data.goal : 0,
    accumulatedAmount: data.accumulatedAmount,
    motivation: data.motivation,
  });

  return {
    ...form,
    toCreateDto,
    toUpdateDto,
  } as UsePocketFormReturn;
}
