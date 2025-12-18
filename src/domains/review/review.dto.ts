import { z } from 'zod';
import { createReviewSchema, reviewListQuerySchema } from './review.schema.js';

export type CreateReviewDto = z.infer<typeof createReviewSchema>;
export type ReviewListQueryDto = z.infer<typeof reviewListQuerySchema>;

export interface ReviewResponseDto {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  content: string;
  createdAt: string;
}

// 리뷰 목록 조회 아이템용
export interface ReviewListItemDto extends ReviewResponseDto {
  updatedAt: string;
  orderItemId: string;
  user: {
    name: string;
  };
}

// 목록 응답 래퍼
export interface ReviewListResponseDto {
  items: ReviewListItemDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
  };
}

// 상세 조회용 DTO
export interface ReviewDetailResponseDto {
  reviewId: string;
  productName: string;
  size: {
    en: string;
    ko: string;
  };
  price: number;
  quantity: number;
  rating: number;
  content: string;
  reviewer: string;
  reviewCreatedAt: string;
  purchasedAt: string;
}
