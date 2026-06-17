import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  const validDto = () => {
    const dto = new RegisterDto();
    dto.email = 'user@example.com';
    dto.password = 'Pass1234';
    dto.name = 'Test User';
    return dto;
  };

  describe('password field', () => {
    it('should accept a valid password "Pass1234"', async () => {
      const dto = validDto();
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject password shorter than 8 characters', async () => {
      const dto = validDto();
      dto.password = 'Abc1';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });

    it('should reject password without uppercase letter', async () => {
      const dto = validDto();
      dto.password = 'abc12345';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });

    it('should reject password without lowercase letter', async () => {
      const dto = validDto();
      dto.password = 'ABC12345';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });

    it('should reject password without a digit', async () => {
      const dto = validDto();
      dto.password = 'Password';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });
  });
});
