import { Router } from 'express';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { validate } from '@/common/middlewares/validate.middleware.js';
import { authenticate } from '@/common/middlewares/auth.middleware.js';
import { reviewController } from './review.container.js';
import {
  createReviewSchema,
  reviewListQuerySchema,
  productReviewParamSchema,
  reviewDetailParamSchema,
} from './review.schema.js';

// 중첩 라우터를 위한 설정, 부모 라우터의 파라미터를 가져오기 위함
export const nestedReviewRouter = Router({ mergeParams: true });

// 리뷰 작성 API
// POST /api/product/:productId/reviews
nestedReviewRouter.post(
  '/',
  authenticate,
  validate(productReviewParamSchema, 'params'),
  validate(createReviewSchema, 'body'),
  asyncHandler(reviewController.create),
);

// 리뷰 목록 조회 API
nestedReviewRouter.get(
  '/',
  validate(productReviewParamSchema, 'params'),
  validate(reviewListQuerySchema, 'query'),
  asyncHandler(reviewController.getReviews),
);

export const reviewRouter = Router();

reviewRouter.get(
  '/:reviewId',
  validate(reviewDetailParamSchema, 'params'), // reviewId 검증
  asyncHandler(reviewController.getReview),
);
