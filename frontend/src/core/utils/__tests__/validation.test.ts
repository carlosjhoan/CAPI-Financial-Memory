import { describe, it, expect } from 'vitest';
import { validationSchemas } from '../validation';

describe('validationSchemas.password', () => {
  it('should accept a valid password "Pass1234"', () => {
    const result = validationSchemas.password.safeParse('Pass1234');
    expect(result.success).toBe(true);
  });

  it('should reject password shorter than 8 characters', () => {
    const result = validationSchemas.password.safeParse('Abc1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        'La contraseña debe tener al menos 8 caracteres',
      );
    }
  });

  it('should reject password without uppercase letter', () => {
    const result = validationSchemas.password.safeParse('abc12345');
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message);
      expect(messages).toContain(
        'La contraseña debe contener al menos una mayúscula',
      );
    }
  });

  it('should reject password without lowercase letter', () => {
    const result = validationSchemas.password.safeParse('ABC12345');
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message);
      expect(messages).toContain(
        'La contraseña debe contener al menos una minúscula',
      );
    }
  });

  it('should reject password without a digit', () => {
    const result = validationSchemas.password.safeParse('Password');
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message);
      expect(messages).toContain(
        'La contraseña debe contener al menos un número',
      );
    }
  });

  it('should accept password with exactly 8 characters meeting all rules', () => {
    const result = validationSchemas.password.safeParse('Pass1234');
    expect(result.success).toBe(true);
  });

  it('should accept password with spaces that meets all rules', () => {
    const result = validationSchemas.password.safeParse('Pass 1234');
    expect(result.success).toBe(true);
  });
});

describe('validationSchemas.passwordConfirmation', () => {
  it('should accept when confirmation matches password', () => {
    const schema = validationSchemas.passwordConfirmation('Pass1234');
    const result = schema.safeParse('Pass1234');
    expect(result.success).toBe(true);
  });

  it('should reject when confirmation does not match password', () => {
    const schema = validationSchemas.passwordConfirmation('Pass1234');
    const result = schema.safeParse('Pass1235');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        'Las contraseñas no coinciden',
      );
    }
  });
});
