import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/)
    .max(80)
    .optional(),
  description: z.string().trim().max(300).optional(),
  image: z.string().trim().max(500).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
