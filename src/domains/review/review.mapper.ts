import { Review } from '@prisma/client';
import { ReviewResponseDto } from './review.dto.js';

// Prisma 결과 타입 정의
type ReviewWithUser = Review & {
  user: {
    name: string;
  };
};

export class ReviewMapper {
  static toResponse(review: ReviewWithUser): ReviewResponseDto {
    return {
      id: review.id,
      userId: review.userId,
      productId: review.productId,
      content: review.content,
      rating: review.rating,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      orderItemId: review.orderItemId,
      user: {
        name: review.user.name,
      },
    };
  }

  static toResponseList(reviews: ReviewWithUser[]): ReviewResponseDto[] {
    return reviews.map((review) => this.toResponse(review));
  }
}
