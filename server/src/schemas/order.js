import { z } from 'zod';
import { pagination } from './common.js';
import { ORDER_STATUSES } from '../models/order.js';

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  line1: z.string().trim().min(3).max(120),
  line2: z.string().trim().max(120).optional().default(''),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  postalCode: z.string().trim().min(3).max(12),
  country: z.string().trim().min(2).max(60),
  phone: z.string().trim().min(6).max(20),
});

export const createOrderSchema = z.object({ shippingAddress: shippingAddressSchema });

export const payOrderSchema = z.object({
  cardLast4: z
    .string()
    .regex(/^\d{4}$/)
    .optional(),
});

export const updateOrderStatusSchema = z.object({ status: z.enum(ORDER_STATUSES) });

export const listOrdersQuery = z.object({
  ...pagination,
  status: z.enum(ORDER_STATUSES).optional(),
});
