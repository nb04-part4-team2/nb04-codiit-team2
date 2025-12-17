import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, '별점은 1점 이상이어야 합니다.')
    .max(5, '별점은 5점 이하여야 합니다.'),
  content: z.string().min(1, '리뷰 내용은 필수입니다.'),
  orderItemId: z.string().cuid('유효한 주문 아이템 ID 형식이 아닙니다.'),
});

export const reviewParamSchema = z.object({
  productId: z.string().cuid().optional(), // 기존 목록 조회용
  reviewId: z.string().cuid().optional(), // 상세 조회용
});

// 리뷰 목록 조회 쿼리 스키마
export const reviewListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10), // 최대 100개 제한
});
