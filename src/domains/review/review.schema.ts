import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, '별점은 1점 이상이어야 합니다.')
    .max(5, '별점은 5점 이하여야 합니다.'),
  content: z.string().trim().min(1, '리뷰 내용은 필수입니다.'),
  orderItemId: z.string().cuid('유효한 주문 아이템 ID 형식이 아닙니다.'),
});

// GET /api/products/:productId/reviews
export const productReviewParamSchema = z.object({
  productId: z.string().cuid('유효한 상품 ID 형식이 아닙니다.'),
});

// GET /api/reviews/:reviewId
export const reviewDetailParamSchema = z.object({
  reviewId: z.string().cuid('유효한 리뷰 ID 형식이 아닙니다.'),
});

export const reviewListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).default(10),
});

// 리뷰 수정 API (PATCH /api/review/:reviewId)
export const updateReviewSchema = z
  .object({
    rating: z
      .number()
      .int()
      .min(1, '별점은 1점 이상이어야 합니다.')
      .max(5, '별점은 5점 이하여야 합니다.')
      .optional(), // 선택적으로 받음
    content: z.string().trim().min(1, '리뷰 내용은 최소 1자 이상이어야 합니다.').optional(), // 선택적으로 받음
  })
  .refine((data) => data.rating !== undefined || data.content !== undefined, {
    message: '평점 또는 리뷰 내용 중 최소 하나는 입력해야 합니다.',
    path: ['rating'], // 에러 메시지가 표시될 위치
  });
