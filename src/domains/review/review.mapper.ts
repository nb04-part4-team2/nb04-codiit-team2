import { ReviewResponseDto, ReviewDetailResponseDto, ReviewListItemDto } from './review.dto.js';
import { ReviewWithDetail, ReviewWithUser } from './review.repository.js';

export class ReviewMapper {
  // 단일 객체 변환 (리뷰 생성 시 사용)
  static toResponse(review: ReviewWithUser): ReviewResponseDto {
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
        // 이미 Repository의 타입에서 user.name이 필수이므로 직접 접근
        name: review.user.name,
      },
    };
  }

  // toListItemResponse에서도 동일하게 적용하거나 toResponse 재사용
  static toListItemResponse(review: ReviewWithUser): ReviewListItemDto {
    return this.toResponse(review);
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
