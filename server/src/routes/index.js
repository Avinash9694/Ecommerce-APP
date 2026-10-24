import { Router } from 'express';
import { authRouter } from './auth.js';
import { categoriesRouter } from './categories.js';
import { productsRouter } from './products.js';
import { healthRouter } from './health.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/products', productsRouter);
