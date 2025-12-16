import { Router } from 'express';
import { authenticate, onlyBuyer } from '@/common/middlewares/auth.middleware.js';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { validate } from '@/common/middlewares/validate.middleware.js';
import { createOrderSchema, orderIdParamSchema } from '@/domains/order/order.schema.js';
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

orderRouter
  .route('/:orderId')
  .get(
    authenticate,
    onlyBuyer,
    validate(orderIdParamSchema, 'params'),
    asyncHandler(orderController.getOrder),
  );

export default orderRouter;
