import { Router } from 'express';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { validate } from '@/common/middlewares/validate.middleware.js';
import { authenticate } from '@/common/middlewares/auth.middleware.js';
import { productController } from './product.container.js';
import { createProductSchema } from './product.dto.js';
import { nestedInquiryRouter } from '../inquiry/inquiry.router.js';

const productRouter = Router();

// 상품 등록 API
productRouter.post(
  '/',
  authenticate,
  validate(createProductSchema, 'body'),
  asyncHandler(productController.create),
);

// 문의 중첩 라우터
productRouter.use('/:productId/inquiries', nestedInquiryRouter);

export default productRouter;
