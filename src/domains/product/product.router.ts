import { Router } from 'express';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { validate } from '@/common/middlewares/validate.middleware.js';
import { authenticate, onlySeller } from '@/common/middlewares/auth.middleware.js'; // onlySeller 추가
import { productController } from './product.container.js';
import { createProductSchema, productListSchema } from './product.schema.js';
import { nestedInquiryRouter } from '../inquiry/inquiry.router.js';

const productRouter = Router();

// 상품 등록 API
productRouter.post(
  '/',
  authenticate,
  onlySeller, // 판매자 권한 확인 미들웨어 추가
  validate(createProductSchema, 'body'),
  asyncHandler(productController.create),
);

// 상품 목록 조회 API
productRouter.get(
  '/',
  authenticate,
  validate(productListSchema, 'query'),
  asyncHandler(productController.getProducts), // 이제 타입 에러 없이 연결됩니다.
);

// 문의 중첩 라우터
productRouter.use('/:productId/inquiries', nestedInquiryRouter);

export default productRouter;
