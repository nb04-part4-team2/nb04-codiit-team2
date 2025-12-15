import { Router } from 'express';
import { authenticate, onlyBuyer } from '@/common/middlewares/auth.middleware.js';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { validate } from '@/common/middlewares/validate.middleware.js';
import { createOrderSchema } from '@/domains/order/order.schema.js';
import { orderController } from '@/domains/order/order.container.js';

const orderRouter = Router();

orderRouter
  .route('/')
  .post(
    authenticate,
    onlyBuyer,
    validate(createOrderSchema, 'body'),
    asyncHandler(orderController.createOrder),
  );

export default orderRouter;
