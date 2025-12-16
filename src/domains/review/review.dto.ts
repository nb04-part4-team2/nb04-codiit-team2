import { z } from 'zod';
import { createReviewSchema, reviewListQuerySchema } from './review.schema.js';

export type CreateReviewDto = z.infer<typeof createReviewSchema>;
export type ReviewListQueryDto = z.infer<typeof reviewListQuerySchema>;

// 응답용 DTO
export interface ReviewResponseDto {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  content: string;
  createdAt: string;
}

// 리뷰 목록 응답 DTO (페이지네이션 포함)
export interface ReviewListResponseDto {
  list: ReviewResponseDto[];
  totalCount: number;
  totalPage: number;
}
