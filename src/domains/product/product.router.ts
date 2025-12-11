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
// 누구나 접근 가능하도록 authenticate를 뺐습니다.
productRouter.get(
  '/',
  validate(productListSchema, 'query'),
  asyncHandler(productController.getProducts),
);

// 문의 중첩 라우터
productRouter.use('/:productId/inquiries', nestedInquiryRouter);

export default productRouter;
