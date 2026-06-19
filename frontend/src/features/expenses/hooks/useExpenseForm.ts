import { useFieldArray } from 'react-hook-form';
import { useBaseForm } from '../../../shared/hooks/useBaseForm';
import { z } from 'zod';
import { dateSchema } from '../../../shared/utils/dateValidation';
import type { CreateExpenseDto, UpdateExpenseDto } from '../types/expense.types';

const expenseSchema = z
  .object({
    amount: z
      .number({ required_error: 'El monto es requerido' })
      .positive('El monto debe ser positivo')
      .max(999999999.99, 'El monto no puede exceder $999.999.999,99'),
    reason: z
      .string({ required_error: 'El motivo es requerido' })
      .min(1, 'El motivo es requerido')
      .max(255, 'El motivo no puede exceder 255 caracteres'),
    date: dateSchema,
    allocations: z
      .array(
        z.object({
          pocketId: z.string().min(1, 'El bolsillo es requerido'),
          amount: z.number().min(0, 'El monto no puede ser negativo'),
        }),
      )
      .optional(),
  })
  .refine(
    (data) => {
      const totalAllocated = data.allocations?.reduce((sum, alloc) => sum + alloc.amount, 0) || 0;
      return Math.abs(totalAllocated - data.amount) < 0.01;
    },
    { message: 'La suma total de los montos debe ser igual al valor RETIRADO', path: ['allocations'] },
  );

// Schema para actualizar — amount puede ser 0 (no editar)
const expenseUpdateSchema = z
  .object({
    amount: z
      .number({ required_error: 'El monto es requerido' })
      .min(0, 'El monto no puede ser negativo')
      .max(999999999.99, 'El monto no puede exceder $999.999.999,99'),
    reason: z
      .string({ required_error: 'El motivo es requerido' })
      .min(1, 'El motivo es requerido')
      .max(255, 'El motivo no puede exceder 255 caracteres'),
    date: z
      .string({ required_error: 'La fecha es requerida' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD'),
    allocations: z
      .array(
        z.object({
          pocketId: z.string().min(1, 'El bolsillo es requerido'),
          amount: z.number().min(0, 'El monto no puede ser negativo'),
        }),
      )
      .optional(),
  })
  .refine(
    (data) => {
      const totalAllocated = data.allocations?.reduce((sum, alloc) => sum + alloc.amount, 0) || 0;
      return Math.abs(totalAllocated - (data.amount || 0)) < 0.01;
    },
    { message: 'La suma total de los montos debe ser igual al valor RETIRADO', path: ['allocations'] },
  );

export type ExpenseFormData = z.infer<typeof expenseSchema>;

export function useExpenseForm(defaultValues?: Partial<ExpenseFormData>, isEditMode = false) {
  const form = useBaseForm({
    schema: expenseSchema,
    defaultValues: {
      amount: 0,
      reason: '',
      date: new Date().toISOString().split('T')[0],
      allocations: [],
      ...defaultValues,
    },
    isEditMode,
    updateSchema: expenseUpdateSchema,
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'allocations',
  });

  const toCreateDto = (data: ExpenseFormData): CreateExpenseDto => ({
    amount: data.amount,
    reason: data.reason,
    date: data.date,
    allocations: data.allocations,
  });

  const toUpdateDto = (data: ExpenseFormData): UpdateExpenseDto => ({
    amount: data.amount,
    reason: data.reason,
    date: data.date,
    allocations: data.allocations,
  });

  return {
    ...form,
    fields,
    append,
    remove,
    replace,
    toCreateDto,
    toUpdateDto,
  };
}
