import { Router } from 'express';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { validate } from '@/common/middlewares/validate.middleware.js';
import { authenticate } from '@/common/middlewares/auth.middleware.js';
import { reviewController } from './review.container.js';
import { createReviewSchema, reviewParamSchema } from './review.schema.js';

// 중첩 라우터를 위한 설정, 부모 라우터의 파라미터를 가져오기 위함
export const nestedReviewRouter = Router({ mergeParams: true });

// 리뷰 작성 API
// POST /api/product/:productId/reviews
nestedReviewRouter.post(
  '/',
  authenticate,
  validate(reviewParamSchema, 'params'), // productId 검증
  validate(createReviewSchema, 'body'), // body 검증
  asyncHandler(reviewController.create),
);
