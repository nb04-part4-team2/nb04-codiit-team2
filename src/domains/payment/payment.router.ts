import { Router } from 'express';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { paymentController } from '@/domains/payment/payment.container.js';
import { authenticate, onlyBuyer } from '@/common/middlewares/auth.middleware.js';
import { createPaymentBody, PaymentCallbackBody } from '@/domains/payment/payment.schema.js';
import { validate } from '@/common/middlewares/validate.middleware.js';

const paymentRouter = Router();

paymentRouter
  .route('/')
  .post(
    authenticate,
    onlyBuyer,
    validate(createPaymentBody, 'body'),
    asyncHandler(paymentController.createPayment),
  );

paymentRouter
  .route('/webhooks/portone')
  .post(validate(PaymentCallbackBody, 'body'), asyncHandler(paymentController.paymentCallback));

export default paymentRouter;
