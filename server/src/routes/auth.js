import { Router } from 'express';
import * as ctrl from '../controllers/auth.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rate-limit.js';
import { asyncHandler } from '../utils/async-handler.js';
import { loginSchema, registerSchema, updateProfileSchema } from '../schemas/auth.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  asyncHandler(ctrl.register),
);
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), asyncHandler(ctrl.login));
authRouter.get('/me', requireAuth, asyncHandler(ctrl.me));
authRouter.patch(
  '/me',
  requireAuth,
  validate({ body: updateProfileSchema }),
  asyncHandler(ctrl.updateProfile),
);
