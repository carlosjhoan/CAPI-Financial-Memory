import { useBaseForm } from '../../../shared/hooks/useBaseForm';
import { z } from 'zod';
import type { CreateDebtDto, UpdateDebtDto } from '../types/debt.types';

const debtSchema = z.object({
  initialAmount: z
    .number({ required_error: 'El monto inicial es requerido' })
    .positive('El monto debe ser positivo')
    .max(999999999.99, 'El monto no puede exceder $999.999.999,99'),
  lender: z
    .string({ required_error: 'El acreedor es requerido' })
    .min(1, 'El acreedor es requerido')
    .max(255, 'El nombre del acreedor no puede exceder 255 caracteres'),
  months: z
    .number({ required_error: 'El número de meses es requerido' })
    .int('Debe ser un número entero')
    .positive('El número de meses debe ser positivo')
    .max(360, 'El número de meses no puede exceder 360'),
  installAmount: z
    .number({ required_error: 'El monto de cuota es requerido' })
    .positive('El monto debe ser positivo')
    .max(999999999.99, 'El monto no puede exceder $999.999.999,99'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD')
    .optional(),
  finalAmount: z.number().positive().optional(),
  reason: z
    .string()
    .max(100, 'El motivo no puede exceder 100 caracteres')
    .optional(),
});

const debtUpdateSchema = z.object({
  initialAmount: z
    .number({ required_error: 'El monto inicial es requerido' })
    .min(0, 'El monto no puede ser negativo')
    .max(999999999.99, 'El monto no puede exceder $999.999.999,99'),
  lender: z
    .string({ required_error: 'El acreedor es requerido' })
    .min(1, 'El acreedor es requerido')
    .max(255, 'El nombre del acreedor no puede exceder 255 caracteres'),
  months: z
    .number({ required_error: 'El número de meses es requerido' })
    .int('Debe ser un número entero')
    .min(0, 'El número de meses no puede ser negativo')
    .max(360, 'El número de meses no puede exceder 360'),
  installAmount: z
    .number({ required_error: 'El monto de cuota es requerido' })
    .min(0, 'El monto no puede ser negativo')
    .max(999999999.99, 'El monto no puede exceder $999.999.999,99'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD')
    .optional(),
  finalAmount: z.number().min(0).optional(),
  reason: z
    .string()
    .max(100, 'El motivo no puede exceder 100 caracteres')
    .optional(),
});

export type DebtFormData = z.infer<typeof debtSchema>;

export function useDebtForm(defaultValues?: Partial<DebtFormData>, isEditMode = false) {
  const form = useBaseForm({
    schema: debtSchema,
    defaultValues: {
      initialAmount: 0,
      lender: '',
      months: 1,
      installAmount: 0,
      date: new Date().toISOString().split('T')[0],
      reason: '',
      ...defaultValues,
    },
    isEditMode,
    updateSchema: debtUpdateSchema,
  });

  const toCreateDto = (data: DebtFormData): CreateDebtDto => ({
    initialAmount: data.initialAmount,
    lender: data.lender,
    months: data.months,
    installAmount: data.installAmount,
    finalAmount: data.installAmount * data.months,
    date: data.date || new Date().toISOString().split('T')[0],
    reason: data.reason || 'Me endeudé y no sé ni para qué',
  });

  const toUpdateDto = (data: DebtFormData): UpdateDebtDto => ({
    initialAmount: data.initialAmount,
    lender: data.lender,
    months: data.months,
    installAmount: data.installAmount,
    finalAmount: data.installAmount * data.months,
    reason: data.reason,
  });

  return {
    ...form,
    toCreateDto,
    toUpdateDto,
  };
}
