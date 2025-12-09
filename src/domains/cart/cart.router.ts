import { Router } from 'express';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { cartController } from '@/domains/cart/cart.container.js';
import { authenticate, onlyBuyer } from '@/common/middlewares/auth.middleware.js';

const cartRouter = Router();

cartRouter.get('/', authenticate, onlyBuyer, asyncHandler(cartController.getCart));

export default cartRouter;
