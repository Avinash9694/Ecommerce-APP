import { z } from 'zod';
import { objectId, pagination, queryBoolean } from './common.js';
import { PRODUCT_SORTS } from '../models/product.js';

const price = z.number().int('Price must be an integer in minor units').min(0);

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/)
    .max(80)
    .optional(),
  description: z.string().trim().min(10).max(2000),
  price,
  currency: z.string().trim().length(3).default('INR'),
  images: z.array(z.string().trim().max(500)).max(8).default([]),
  category: objectId,
  stock: z.number().int().min(0).default(0),
  tags: z.array(z.string().trim().min(1).max(30)).max(12).default([]),
  featured: z.boolean().default(false),
  rating: z
    .object({ average: z.number().min(0).max(5), count: z.number().int().min(0) })
    .optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const listProductsQuery = z
  .object({
    ...pagination,
    q: z.string().trim().max(100).optional(),
    category: z.string().trim().max(80).optional(),
    tag: z.string().trim().max(30).optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    sort: z.enum(PRODUCT_SORTS).default('newest'),
    featured: queryBoolean.optional(),
  })
  .refine((q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice, {
    message: 'minPrice must be less than or equal to maxPrice',
    path: ['minPrice'],
  });
