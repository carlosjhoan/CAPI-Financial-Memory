import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const depositFormSchema = z.object({
  amount: z
    .number({ required_error: 'El monto es requerido' })
    .positive('El monto debe ser mayor a 0'),
  date: z
    .string({ required_error: 'La fecha es requerida' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'),
  newGoal: z.number().optional(),
});

export type DepositFormData = z.infer<typeof depositFormSchema>;

export function useDepositForm(defaultValues?: Partial<DepositFormData>) {
  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      amount: 0,
      date: today,
      ...defaultValues,
    },
  });

  return {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    reset,
    setValue,
    watch,
  };
}
