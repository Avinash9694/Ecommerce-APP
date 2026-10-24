import { describe, expect, it } from 'vitest';
import {
  EMPTY_ADDRESS,
  formatCardNumber,
  mockCardSchema,
  shippingAddressSchema,
} from '../checkout-schema';

const validAddress = {
  ...EMPTY_ADDRESS,
  fullName: 'Asha Rao',
  line1: '12 Jubilee Hills Road',
  city: 'Hyderabad',
  state: 'Telangana',
  postalCode: '500033',
  phone: '+91 98765 43210',
};

describe('shippingAddressSchema', () => {
  it('accepts a complete address', () => {
    expect(shippingAddressSchema.safeParse(validAddress).success).toBe(true);
  });

  it('reports every missing required field', () => {
    const result = shippingAddressSchema.safeParse(EMPTY_ADDRESS);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toEqual(
        expect.arrayContaining(['fullName', 'line1', 'city', 'state', 'postalCode', 'phone']),
      );
      expect(paths).not.toContain('country');
    }
  });

  it('rejects malformed postal codes and phone numbers', () => {
    expect(shippingAddressSchema.safeParse({ ...validAddress, postalCode: '!' }).success).toBe(
      false,
    );
    expect(shippingAddressSchema.safeParse({ ...validAddress, phone: 'call me' }).success).toBe(
      false,
    );
  });
});

describe('mockCardSchema', () => {
  const card = {
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/39',
    cvc: '123',
    nameOnCard: 'Asha Rao',
  };

  it('accepts a formatted 16-digit card with a future expiry', () => {
    const result = mockCardSchema.safeParse(card);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.cardNumber).toBe('4242424242424242');
  });

  it('rejects a short card number, bad expiry format and a past expiry', () => {
    expect(mockCardSchema.safeParse({ ...card, cardNumber: '4242' }).success).toBe(false);
    expect(mockCardSchema.safeParse({ ...card, expiry: '2028-12' }).success).toBe(false);
    expect(mockCardSchema.safeParse({ ...card, expiry: '01/20' }).success).toBe(false);
  });

  it('formats card numbers into groups of four as the user types', () => {
    expect(formatCardNumber('4242424242424242999')).toBe('4242 4242 4242 4242');
    expect(formatCardNumber('42a4')).toBe('424');
  });
});
