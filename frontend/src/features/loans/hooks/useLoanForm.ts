import { useBaseForm } from '../../../shared/hooks/useBaseForm';
import { z } from 'zod';
import type { CreateLoanDto, UpdateLoanDto } from '../types/loan.types';

const loanSchema = z.object({
  initialAmount: z
    .number({ required_error: 'El monto inicial es requerido' })
    .min(0, 'El monto no puede ser negativo')
    .max(999999999.99, 'El monto no puede exceder $999.999.999,99'),
  interestRate: z
    .number({ required_error: 'La tasa de interés es requerida' })
    .min(0, 'La tasa de interés no puede ser negativa')
    .max(100, 'La tasa de interés no puede exceder 100%'),
  installment: z
    .number({ required_error: 'La cuota mensual es requerida' })
    .min(0, 'La cuota no puede ser negativa')
    .max(999999999.99, 'La cuota no puede exceder $999.999.999,99'),
  debtor: z
    .string({ required_error: 'El deudor es requerido' })
    .min(1, 'El deudor es requerido')
    .max(255, 'El nombre del deudor no puede exceder 255 caracteres'),
  date: z
    .string({ required_error: 'La fecha es requerida' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD'),
});

export type LoanFormData = z.infer<typeof loanSchema>;

export function useLoanForm(defaultValues?: Partial<LoanFormData>, _isEditMode = false) {
  const form = useBaseForm({
    schema: loanSchema,
    defaultValues: {
      initialAmount: 0,
      interestRate: 0,
      installment: 0,
      debtor: '',
      date: new Date().toISOString().split('T')[0],
      ...defaultValues,
    },
  });

  const toCreateDto = (data: LoanFormData): CreateLoanDto => ({
    initialAmount: data.initialAmount,
    interestRate: data.interestRate,
    installment: data.installment,
    debtor: data.debtor,
    date: data.date,
  });

  const toUpdateDto = (data: LoanFormData): UpdateLoanDto => ({
    interestRate: data.interestRate,
    installment: data.installment,
    debtor: data.debtor,
  });

  return {
    ...form,
    toCreateDto,
    toUpdateDto,
  };
}
