import { Prisma } from '@prisma/client';
import { ReviewRepository } from './review.repository.js';
import {
  CreateReviewDto,
  ReviewListQueryDto,
  ReviewListResponseDto,
  ReviewResponseDto,
  ReviewDetailResponseDto,
} from './review.dto.js';
import { ReviewMapper } from './review.mapper.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/common/utils/errors.js';

export class ReviewService {
  constructor(private reviewRepository: ReviewRepository) {}

  async createReview(
    userId: string,
    productId: string,
    data: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    // 주문 아이템 존재 여부 및 정보 조회
    const orderItem = await this.reviewRepository.findOrderItemById(data.orderItemId);

    if (!orderItem) {
      throw new NotFoundError('주문 정보를 찾을 수 없습니다.');
    }

    // 권한 검증: 요청한 유저가 해당 주문의 구매자인지 확인
    if (orderItem.order.buyerId !== userId) {
      throw new ForbiddenError('해당 상품을 구매한 사용자만 리뷰를 작성할 수 있습니다.');
    }

    // 상품 검증: 주문한 상품이 현재 리뷰를 작성하려는 상품과 일치하는지 확인
    if (orderItem.productId !== productId) {
      throw new BadRequestError('주문한 상품 정보와 일치하지 않습니다.');
    }

    // 빠른 실패를 위한 어플리케이션 레벨 검증
    // 이 코드가 있어도 동시성 이슈는 발생할 수 있지만, 일반적인 상황에서 DB 요청을 아껴줍니다.
    if (orderItem.review) {
      throw new BadRequestError('이미 리뷰를 작성한 주문 건입니다.');
    }

    try {
      // 리뷰 생성 (동시성 문제 해결 구간)
      // DB의 Unique Constraint(orderItemId)가 중복을 막아줍니다.
      const review = await this.reviewRepository.create(userId, productId, data);
      return ReviewMapper.toResponse(review);
    } catch (error) {
      // Prisma Unique Constraint Violation 에러 코드: P2002
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestError('이미 리뷰를 작성한 주문 건입니다.');
      }

      // 예상치 못한 다른 에러는 그대로 던짐
      throw error;
    }
  }

  // 리뷰 상세 조회
  async getReview(reviewId: string): Promise<ReviewDetailResponseDto> {
    const review = await this.reviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundError('요청한 리소스를 찾을 수 없습니다.');
    }

    // 수정된 매퍼 사용
    return ReviewMapper.toDetailResponse(review);
  }

  // 리뷰 목록 조회
  async getReviews(productId: string, query: ReviewListQueryDto): Promise<ReviewListResponseDto> {
    // 상품 존재 여부 확인
    const product = await this.reviewRepository.findProductById(productId);
    if (!product) {
      throw new NotFoundError('요청한 리소스를 찾을 수 없습니다.');
    }

    // 페이지네이션 오프셋 계산
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    // 리뷰 데이터 및 전체 개수 조회
    const [reviews, totalCount] = await Promise.all([
      this.reviewRepository.findAllByProductId(productId, skip, limit),
      this.reviewRepository.countByProductId(productId),
    ]);

    // 메타데이터 계산 전체 개수가 현재 페이지의 상한(skip + limit)보다 크면 다음 페이지가 있음
    const hasNextPage = totalCount > skip + limit;

    // 응답 반환
    const items = reviews.map((review) => ReviewMapper.toListItemResponse(review));

    return {
      items,
      meta: {
        total: totalCount,
        page,
        limit,
        hasNextPage,
      },
    };
  }
}
