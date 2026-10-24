import { z } from 'zod';
import { objectId } from './common.js';

const qty = z.number().int().min(1).max(99);

export const addCartItemSchema = z.object({ productId: objectId, qty: qty.default(1) });
export const updateCartItemSchema = z.object({ qty: z.number().int().min(0).max(99) });
export const productIdParams = z.object({ productId: objectId });
