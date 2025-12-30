import { Prisma } from '@prisma/client';
import { ReviewWithDetail, ReviewWithUser } from '@/domains/review/review.repository.js';
import { CreateReviewDto, UpdateReviewDto } from '@/domains/review/review.dto.js';

/**
 * Repository의 findOrderItemById 메서드가 반환하는 타입 정의
 * - Repository 구현부의 include/select 옵션과 일치해야 합니다.
 */
export type OrderItemForReview = Prisma.OrderItemGetPayload<{
  include: {
    order: {
      select: { buyerId: true };
    };
    review: {
      select: { id: true };
    };
  };
}>;

/**
 * 리뷰 생성 요청 DTO Mock
 */
export const createReviewInputMock = (
  overrides: Partial<CreateReviewDto> = {},
): CreateReviewDto => {
  return {
    orderItemId: 'order-item-id-1',
    rating: 5,
    content: '정말 만족스러운 상품입니다.',
    ...overrides,
  };
};

/**
 * 리뷰 수정 요청 DTO Mock
 */
export const updateReviewInputMock = (
  overrides: Partial<UpdateReviewDto> = {},
): UpdateReviewDto => {
  return {
    rating: 4,
    content: '사용해보니 조금 아쉬운 점이 있네요.',
    ...overrides,
  };
};

/**
 * Repository - findOrderItemById 결과 Mock
 * - OrderItemForReview 타입을 강제하여 타입 에러 방지
 */
export const mockOrderItem = (overrides: Partial<OrderItemForReview> = {}): OrderItemForReview => {
  const defaultData: OrderItemForReview = {
    id: 'order-item-id-1',
    orderId: 'order-id-1',
    productId: 'product-id-1',
    sizeId: 1,
    price: 10000,
    quantity: 1,

    order: {
      buyerId: 'user-id-1',
    },
    review: null,
  };

  return { ...defaultData, ...overrides };
};

/**
 * Repository - Review 생성/조회 결과 (ReviewWithUser) Mock
 */
export const mockReviewWithUser = (overrides: Partial<ReviewWithUser> = {}): ReviewWithUser => {
  const defaultReview: ReviewWithUser = {
    id: 'review-id-1',
    userId: 'user-id-1',
    productId: 'product-id-1',
    orderItemId: 'order-item-id-1',
    rating: 5,
    content: '최고입니다.',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      name: '테스트유저',
    },
  };
  return { ...defaultReview, ...overrides };
};

/**
 * Repository - Review 상세 조회 결과 (ReviewWithDetail) Mock
 */
export const mockReviewWithDetail = (
  overrides: Partial<ReviewWithDetail> = {},
): ReviewWithDetail => {
  const basic = mockReviewWithUser(overrides);

  // ReviewWithDetail 타입에 맞춰 필수 관계형 필드 추가
  const detail: ReviewWithDetail = {
    ...basic,
    product: {
      name: '테스트 상품',
    },
    orderItem: {
      id: 'order-item-id-1',
      price: 20000,
      quantity: 1,
      orderId: 'order-id-1',
      productId: 'product-id-1',
      sizeId: 1,
      size: {
        id: 1,
        en: 'L',
        ko: '라지',
      },
      order: {
        createdAt: new Date(),
      },
    },
  };

  return { ...detail, ...overrides };
};
