import { Router } from 'express';
import { authenticate, onlyBuyer } from '@/common/middlewares/auth.middleware.js';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { validate } from '@/common/middlewares/validate.middleware.js';
import {
  orderSchema,
  orderIdParamSchema,
  createOrderSchema,
} from '@/domains/order/order.schema.js';
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
  )
  .patch(
    authenticate,
    onlyBuyer,
    validate(orderIdParamSchema, 'params'),
    validate(orderSchema, 'body'),
    asyncHandler(orderController.updateOrder),
  )
  .delete(
    authenticate,
    onlyBuyer,
    validate(orderIdParamSchema, 'params'),
    asyncHandler(orderController.deleteOrder),
  );

export default orderRouter;
