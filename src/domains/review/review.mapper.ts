import { Review } from '@prisma/client';
import { ReviewResponseDto } from './review.dto.js';

export class ReviewMapper {
  static toResponse(review: Review): ReviewResponseDto {
    return {
      id: review.id,
      userId: review.userId,
      productId: review.productId,
      rating: review.rating,
      content: review.content,
      createdAt: review.createdAt.toISOString(),
    };
  }

  // 리뷰 배열을 DTO 배열로 변환하는 헬퍼 메서드
  static toResponseList(reviews: Review[]): ReviewResponseDto[] {
    return reviews.map((review) => this.toResponse(review));
  }
}
