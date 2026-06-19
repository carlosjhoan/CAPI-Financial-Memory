import { z } from 'zod';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface DateConstraints {
  minDate: string;
  maxDate: string;
}

export function getDateConstraints(): DateConstraints {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const minDate = new Date(today.getTime() - 15 * MS_PER_DAY);
  const minDateStr = minDate.toISOString().split('T')[0];
  return { minDate: minDateStr, maxDate: todayStr };
}

export const dateSchema = z
  .string({ required_error: 'La fecha es requerida' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD')
  .refine(
    (val) => val <= getDateConstraints().maxDate,
    'La fecha no puede ser mayor al día actual',
  )
  .refine(
    (val) => val >= getDateConstraints().minDate,
    'La fecha no puede ser anterior a 15 días',
  );

export const dateSchemaOptional = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD')
  .refine(
    (val) => val <= getDateConstraints().maxDate,
    'La fecha no puede ser mayor al día actual',
  )
  .refine(
    (val) => val >= getDateConstraints().minDate,
    'La fecha no puede ser anterior a 15 días',
  )
  .optional();
