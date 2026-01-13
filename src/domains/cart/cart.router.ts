import { Router } from 'express';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { cartController } from '@/domains/cart/cart.container.js';
import { authenticate, onlyBuyer } from '@/common/middlewares/auth.middleware.js';
import { cartItemIdParamSchema, updateCartSchema } from '@/domains/cart/cart.schema.js';
import { validate } from '@/common/middlewares/validate.middleware.js';

const cartRouter = Router();

cartRouter
  .route('/')
  .get(authenticate, onlyBuyer, asyncHandler(cartController.getCart))
  .post(authenticate, onlyBuyer, asyncHandler(cartController.createCart))
  .patch(
    authenticate,
    onlyBuyer,
    validate(updateCartSchema, 'body'),
    asyncHandler(cartController.updateCart),
  );

cartRouter
  .route('/:cartItemId')
  .get(
    authenticate,
    onlyBuyer,
    validate(cartItemIdParamSchema, 'params'),
    asyncHandler(cartController.getCartItem),
  )
  .delete(
    authenticate,
    onlyBuyer,
    validate(cartItemIdParamSchema, 'params'),
    asyncHandler(cartController.deleteCartItem),
  );

export default cartRouter;
