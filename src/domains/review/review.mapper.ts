import { Review } from '@prisma/client';
import { ReviewResponseDto, ReviewListItemDto } from './review.dto.js';

// Prisma의 Include 결과 타입 정의
type ReviewWithUser = Review & {
  user: {
    name: string;
  };
};

export class ReviewMapper {
  // 단일 객체 변환 (리뷰 생성 시 사용)
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

  // 목록 아이템 변환 (리뷰 목록 조회 시 사용)
  static toListItemResponse(review: ReviewWithUser): ReviewListItemDto {
    return {
      id: review.id,
      userId: review.userId,
      productId: review.productId,
      rating: review.rating,
      content: review.content,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      orderItemId: review.orderItemId,
      user: {
        name: review.user.name,
      },
    };
  }
}
