import { Router } from 'express';
import * as ctrl from '../controllers/cart.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { addCartItemSchema, productIdParams, updateCartItemSchema } from '../schemas/cart.js';

export const cartRouter = Router();

cartRouter.use(requireAuth);
cartRouter.get('/', asyncHandler(ctrl.getCart));
cartRouter.post('/items', validate({ body: addCartItemSchema }), asyncHandler(ctrl.addItem));
cartRouter.patch(
  '/items/:productId',
  validate({ params: productIdParams, body: updateCartItemSchema }),
  asyncHandler(ctrl.updateItem),
);
cartRouter.delete(
  '/items/:productId',
  validate({ params: productIdParams }),
  asyncHandler(ctrl.removeItem),
);
cartRouter.delete('/', asyncHandler(ctrl.clearCart));
