import { z } from 'zod';
import { createReviewSchema, reviewListQuerySchema } from './review.schema.js';

export type CreateReviewDto = z.infer<typeof createReviewSchema>;
export type ReviewListQueryDto = z.infer<typeof reviewListQuerySchema>;

// 개별 리뷰 응답 (user.name 포함)
export interface ReviewResponseDto {
  id: string;
  userId: string;
  productId: string;
  content: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
  orderItemId: string;
  user: {
    name: string;
  };
}

// 전체 목록 응답
export interface ReviewListResponseDto {
  items: ReviewResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
  };
}
