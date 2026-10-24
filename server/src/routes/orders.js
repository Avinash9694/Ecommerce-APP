import { Router } from 'express';
import * as ctrl from '../controllers/orders.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { idParams } from '../schemas/common.js';
import {
  createOrderSchema,
  listOrdersQuery,
  payOrderSchema,
  updateOrderStatusSchema,
} from '../schemas/order.js';

export const ordersRouter = Router();

ordersRouter.use(requireAuth);
ordersRouter.post('/', validate({ body: createOrderSchema }), asyncHandler(ctrl.createOrder));
ordersRouter.get('/mine', asyncHandler(ctrl.listMyOrders));
ordersRouter.get('/mine/:id', validate({ params: idParams }), asyncHandler(ctrl.getMyOrder));
ordersRouter.post(
  '/mine/:id/pay',
  validate({ params: idParams, body: payOrderSchema }),
  asyncHandler(ctrl.payOrder),
);
ordersRouter.post(
  '/mine/:id/cancel',
  validate({ params: idParams }),
  asyncHandler(ctrl.cancelMyOrder),
);

ordersRouter.get(
  '/',
  requireAdmin,
  validate({ query: listOrdersQuery }),
  asyncHandler(ctrl.adminListOrders),
);
ordersRouter.patch(
  '/:id/status',
  requireAdmin,
  validate({ params: idParams, body: updateOrderStatusSchema }),
  asyncHandler(ctrl.adminUpdateStatus),
);
