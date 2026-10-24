import { Router } from 'express';
import * as ctrl from '../controllers/categories.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { idParams, slugParams } from '../schemas/common.js';
import { createCategorySchema, updateCategorySchema } from '../schemas/category.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', asyncHandler(ctrl.listCategories));
categoriesRouter.get('/:slug', validate({ params: slugParams }), asyncHandler(ctrl.getCategory));

categoriesRouter.use(requireAuth, requireAdmin);
categoriesRouter.post(
  '/',
  validate({ body: createCategorySchema }),
  asyncHandler(ctrl.createCategory),
);
categoriesRouter.patch(
  '/:id',
  validate({ params: idParams, body: updateCategorySchema }),
  asyncHandler(ctrl.updateCategory),
);
categoriesRouter.delete('/:id', validate({ params: idParams }), asyncHandler(ctrl.deleteCategory));
