import { z } from 'zod';
import { createReviewSchema } from './review.schema.js';

export type CreateReviewDto = z.infer<typeof createReviewSchema>;

// 응답용 DTO
export interface ReviewResponseDto {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  content: string;
  createdAt: string;
}
