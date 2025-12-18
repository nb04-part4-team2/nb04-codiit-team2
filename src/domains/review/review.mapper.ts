import { Review } from '@prisma/client';
import { ReviewResponseDto, ReviewDetailResponseDto, ReviewListItemDto } from './review.dto.js';
import { ReviewWithDetail } from './review.repository.js';

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

  // 상세 조회용 매퍼
  static toDetailResponse(review: ReviewWithDetail): ReviewDetailResponseDto {
    return {
      reviewId: review.id,
      productName: review.product?.name ?? '상품 정보 없음',
      size: {
        en: review.orderItem?.size?.en ?? '',
        ko: review.orderItem?.size?.ko ?? '',
      },
      price: review.orderItem?.price ?? 0,
      quantity: review.orderItem?.quantity ?? 0,

      rating: review.rating,
      content: review.content,
      reviewer: review.user?.name ?? '알 수 없음',
      reviewCreatedAt: review.createdAt.toISOString(),
      purchasedAt: review.orderItem?.order?.createdAt?.toISOString() ?? '',
    };
  }
}
