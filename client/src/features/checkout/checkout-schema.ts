import { z } from 'zod';

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter the recipient name').max(80),
  line1: z.string().trim().min(3, 'Enter a street address').max(120),
  line2: z.string().trim().max(120).optional().or(z.literal('')),
  city: z.string().trim().min(2, 'Enter a city').max(60),
  state: z.string().trim().min(2, 'Enter a state').max(60),
  postalCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9][A-Za-z0-9 -]{2,10}$/, 'Enter a valid postal code'),
  country: z.string().trim().min(2, 'Enter a country').max(60),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{6,20}$/, 'Enter a valid phone number'),
});

export type ShippingAddressForm = z.infer<typeof shippingAddressSchema>;

export const mockCardSchema = z.object({
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\s+/g, ''))
    .pipe(z.string().regex(/^\d{16}$/, 'Enter a 16-digit card number')),
  expiry: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY')
    .refine((value) => {
      const [mm, yy] = value.split('/').map(Number);
      const expires = new Date(2000 + (yy as number), mm as number, 0);
      return expires >= new Date();
    }, 'Card has expired'),
  cvc: z
    .string()
    .trim()
    .regex(/^\d{3,4}$/, 'Enter the 3 or 4 digit code'),
  nameOnCard: z.string().trim().min(2, 'Enter the name on the card'),
});

export type MockCardForm = z.infer<typeof mockCardSchema>;

export const formatCardNumber = (raw: string): string =>
  raw
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

export const EMPTY_ADDRESS: ShippingAddressForm = {
  fullName: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  phone: '',
};
