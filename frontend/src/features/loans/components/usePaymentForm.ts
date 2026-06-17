import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const paymentSchema = z.object({
  amount: z
    .number({ required_error: 'El monto del pago es requerido' })
    .positive('El monto debe ser positivo')
    .max(999999999.99, 'El monto no puede exceder $999.999.999,99'),
  date: z
    .string({ required_error: 'La fecha es requerida' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD'),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

export function usePaymentForm(defaultValues?: Partial<PaymentFormData>) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    control,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      date: new Date().toISOString().split('T')[0],
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
    control,
  };
}
