import { Router } from 'express';
import * as ctrl from '../controllers/products.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { idParams, slugParams } from '../schemas/common.js';
import { createProductSchema, listProductsQuery, updateProductSchema } from '../schemas/product.js';

export const productsRouter = Router();

productsRouter.get('/', validate({ query: listProductsQuery }), asyncHandler(ctrl.listProducts));
productsRouter.get('/:slug', validate({ params: slugParams }), asyncHandler(ctrl.getProductBySlug));

productsRouter.use(requireAuth, requireAdmin);
productsRouter.post('/', validate({ body: createProductSchema }), asyncHandler(ctrl.createProduct));
productsRouter.patch(
  '/:id',
  validate({ params: idParams, body: updateProductSchema }),
  asyncHandler(ctrl.updateProduct),
);
productsRouter.delete('/:id', validate({ params: idParams }), asyncHandler(ctrl.deleteProduct));
