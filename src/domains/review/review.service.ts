import { ReviewRepository } from './review.repository.js';
import { CreateReviewDto, ReviewResponseDto } from './review.dto.js';
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

    // 중복 리뷰 검증: 이미 해당 주문 건에 대해 리뷰를 작성했는지 확인
    if (orderItem.review) {
      throw new BadRequestError('이미 리뷰를 작성한 주문 건입니다.');
    }

    // 리뷰 생성
    const review = await this.reviewRepository.create(userId, productId, data);

    return ReviewMapper.toResponse(review);
  }
}
