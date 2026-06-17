import { z } from 'zod';

export const validationSchemas = {
  // Validación para montos monetarios
  amount: z
    .number({ required_error: 'El monto es requerido' })
    .positive('El monto debe ser positivo')
    .max(9999999.99, 'El monto no puede exceder 9,999,999.99'),

  // Validación para texto con límite de caracteres
  text: (fieldName: string, maxLength: number = 255) =>
    z
      .string({ required_error: `${fieldName} es requerido` })
      .min(1, `${fieldName} es requerido`)
      .max(maxLength, `${fieldName} no puede exceder ${maxLength} caracteres`),

  // Validación para fechas en formato YYYY-MM-DD
  date: z
    .string({ required_error: 'La fecha es requerida' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD'),

  // Validación para emails
  email: z
    .string({ required_error: 'El email es requerido' })
    .email('Email inválido'),

  // Validación para contraseñas
  password: z
    .string({ required_error: 'La contraseña es requerida' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),

  // Validación para confirmación de contraseña
  passwordConfirmation: (password: string) =>
    z
      .string({ required_error: 'La confirmación de contraseña es requerida' })
      .min(1, 'La confirmación de contraseña es requerida')
      .refine((val) => val === password, {
        message: 'Las contraseñas no coinciden',
      }),

  // Validación para URLs
  url: z
    .string({ required_error: 'La URL es requerida' })
    .url('URL inválida'),

  // Validación para números de teléfono
  phone: z
    .string({ required_error: 'El teléfono es requerido' })
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Número de teléfono inválido'),
};

// Función para validar un objeto contra un schema
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errors = result.error.errors.map(err => err.message);
    return { success: false, errors };
  }
}

// Función para formatear errores de validación
export function formatValidationErrors(errors: string[]): string {
  return errors.join('. ');
}