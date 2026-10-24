import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema, zodFieldErrors } from '../auth-schemas';

describe('auth schemas', () => {
  it('requires both email and password to sign in', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(zodFieldErrors(result.error)).toEqual({
        email: 'Enter a valid email address',
        password: 'Password is required',
      });
    }
  });

  it('enforces a minimum password length and matching confirmation on register', () => {
    const result = registerSchema.safeParse({
      name: 'A',
      email: 'a@b.co',
      password: 'short',
      confirmPassword: 'different',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = zodFieldErrors(result.error);
      expect(errors.name).toBeDefined();
      expect(errors.password).toBe('Use at least 8 characters');
      expect(errors.confirmPassword).toBe('Passwords do not match');
    }
  });

  it('accepts a valid registration', () => {
    expect(
      registerSchema.safeParse({
        name: 'Asha Rao',
        email: 'asha@shop.test',
        password: 'longenough1',
        confirmPassword: 'longenough1',
      }).success,
    ).toBe(true);
  });
});
