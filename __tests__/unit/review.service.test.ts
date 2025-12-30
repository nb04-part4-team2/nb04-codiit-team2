import { jest } from '@jest/globals';
import { ReviewService } from '@/domains/review/review.service.js';
import { ReviewRepository } from '@/domains/review/review.repository.js';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import {
  createReviewInputMock,
  updateReviewInputMock,
  mockOrderItem,
  mockReviewWithUser,
  mockReviewWithDetail,
} from '../mocks/review.mock.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/common/utils/errors.js';
import { Prisma } from '@prisma/client';

describe('ReviewService 유닛 테스트', () => {
  let reviewService: ReviewService;
  let reviewRepository: DeepMockProxy<ReviewRepository>;

  // 공통 변수
  const userId = 'user-id-1';
  const otherUserId = 'user-id-2';
  const productId = 'product-id-1';
  const reviewId = 'review-id-1';

  beforeEach(() => {
    reviewRepository = mockDeep<ReviewRepository>();
    reviewService = new ReviewService(reviewRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // 리뷰 생성 테스트
  describe('createReview', () => {
    it('리뷰 생성 성공', async () => {
      // Arrange
      const input = createReviewInputMock();
      const orderItemMock = mockOrderItem({
        productId: productId,
        order: { buyerId: userId },
        review: null,
      });
      const createdReview = mockReviewWithUser();

      // Mock Setup
      reviewRepository.findOrderItemById.mockResolvedValue(orderItemMock);
      reviewRepository.create.mockResolvedValue(createdReview);

      // Act
      const result = await reviewService.createReview(userId, productId, input);

      // Assert
      expect(reviewRepository.findOrderItemById).toHaveBeenCalledWith(input.orderItemId);
      expect(reviewRepository.create).toHaveBeenCalledWith(userId, productId, input);
      expect(result.id).toBe(createdReview.id);
    });

    it('주문 정보를 찾을 수 없으면 NotFoundError 발생', async () => {
      reviewRepository.findOrderItemById.mockResolvedValue(null);

      await expect(
        reviewService.createReview(userId, productId, createReviewInputMock()),
      ).rejects.toThrow(NotFoundError);
    });

    it('주문자가 아니면 ForbiddenError 발생', async () => {
      const orderItemMock = mockOrderItem({
        order: { buyerId: otherUserId }, // 다른 유저 ID
      });

      reviewRepository.findOrderItemById.mockResolvedValue(orderItemMock);

      await expect(
        reviewService.createReview(userId, productId, createReviewInputMock()),
      ).rejects.toThrow(ForbiddenError);
    });

    it('주문한 상품과 리뷰 작성하려는 상품이 다르면 BadRequestError 발생', async () => {
      const orderItemMock = mockOrderItem({
        productId: 'other-product-id', // 상품 불일치
        order: { buyerId: userId },
      });

      reviewRepository.findOrderItemById.mockResolvedValue(orderItemMock);

      await expect(
        reviewService.createReview(userId, productId, createReviewInputMock()),
      ).rejects.toThrow(BadRequestError);
    });

    it('이미 리뷰가 존재하면 BadRequestError 발생 (App Level Check)', async () => {
      const orderItemMock = mockOrderItem({
        productId: productId,
        order: { buyerId: userId },
        review: { id: 'existing-review-id' }, // 이미 리뷰 존재
      });

      reviewRepository.findOrderItemById.mockResolvedValue(orderItemMock);

      await expect(
        reviewService.createReview(userId, productId, createReviewInputMock()),
      ).rejects.toThrow(BadRequestError);
    });

    it('Prisma P2002 에러(중복 생성) 발생 시 BadRequestError로 변환', async () => {
      const orderItemMock = mockOrderItem({
        productId: productId,
        order: { buyerId: userId },
        review: null,
      });

      reviewRepository.findOrderItemById.mockResolvedValue(orderItemMock);

      // Prisma Unique Constraint Error 모의
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });
      reviewRepository.create.mockRejectedValue(prismaError);

      await expect(
        reviewService.createReview(userId, productId, createReviewInputMock()),
      ).rejects.toThrow(BadRequestError);
    });
  });

  // 리뷰 상세 조회 테스트
  describe('getReview', () => {
    it('리뷰 상세 조회 성공', async () => {
      const mockDetail = mockReviewWithDetail({ id: reviewId });
      reviewRepository.findById.mockResolvedValue(mockDetail);

      const result = await reviewService.getReview(reviewId);

      expect(reviewRepository.findById).toHaveBeenCalledWith(reviewId);
      expect(result.reviewId).toBe(reviewId);
      expect(result.productName).toBe(mockDetail.product.name);
    });

    it('리뷰가 존재하지 않으면 NotFoundError 발생', async () => {
      reviewRepository.findById.mockResolvedValue(null);

      await expect(reviewService.getReview(reviewId)).rejects.toThrow(NotFoundError);
    });
  });

  // 리뷰 목록 조회 테스트
  describe('getReviews', () => {
    it('리뷰 목록 조회 성공 (페이지네이션 포함)', async () => {
      // Arrange
      const query = { page: 1, limit: 10 };
      const mockList = [mockReviewWithUser({ id: 'r1' }), mockReviewWithUser({ id: 'r2' })];

      // 상품 존재 확인 Mock
      reviewRepository.findProductById.mockResolvedValue({ id: productId });

      // 목록 및 카운트 조회 Mock
      reviewRepository.findAllByProductId.mockResolvedValue(mockList);
      reviewRepository.countByProductId.mockResolvedValue(2);

      // Act
      const result = await reviewService.getReviews(productId, query);

      // Assert
      expect(reviewRepository.findProductById).toHaveBeenCalledWith(productId);
      expect(reviewRepository.findAllByProductId).toHaveBeenCalledWith(productId, 0, 10);
      expect(reviewRepository.countByProductId).toHaveBeenCalledWith(productId);
      expect(result.items).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.hasNextPage).toBe(false);
    });

    it('상품이 존재하지 않으면 NotFoundError 발생', async () => {
      reviewRepository.findProductById.mockResolvedValue(null);

      const query = { page: 1, limit: 10 };
      await expect(reviewService.getReviews(productId, query)).rejects.toThrow(NotFoundError);
    });
  });

  // 리뷰 수정 테스트
  describe('updateReview', () => {
    it('리뷰 수정 성공', async () => {
      // Arrange
      const input = updateReviewInputMock();
      const existingReview = mockReviewWithDetail({ id: reviewId, userId: userId });
      const updatedReview = mockReviewWithUser({ ...input, id: reviewId, userId: userId });

      // findById는 Detail 타입을 반환하므로 existingReview(Detail 타입) 사용
      reviewRepository.findById.mockResolvedValue(existingReview);
      reviewRepository.update.mockResolvedValue(updatedReview);

      // Act
      const result = await reviewService.updateReview(userId, reviewId, input);

      // Assert
      expect(reviewRepository.findById).toHaveBeenCalledWith(reviewId);
      expect(reviewRepository.update).toHaveBeenCalledWith(reviewId, input);
      expect(result.rating).toBe(input.rating);
    });

    it('리뷰가 없으면 NotFoundError 발생', async () => {
      reviewRepository.findById.mockResolvedValue(null);

      await expect(
        reviewService.updateReview(userId, reviewId, updateReviewInputMock()),
      ).rejects.toThrow(NotFoundError);
    });

    it('작성자가 아니면 ForbiddenError 발생', async () => {
      const existingReview = mockReviewWithDetail({ id: reviewId, userId: otherUserId });
      reviewRepository.findById.mockResolvedValue(existingReview);

      await expect(
        reviewService.updateReview(userId, reviewId, updateReviewInputMock()),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  // 리뷰 삭제 테스트
  describe('deleteReview', () => {
    it('리뷰 삭제 성공', async () => {
      // Arrange
      const existingReview = mockReviewWithDetail({ id: reviewId, userId: userId });
      reviewRepository.findById.mockResolvedValue(existingReview);

      reviewRepository.delete.mockResolvedValue(existingReview);

      // Act
      const result = await reviewService.deleteReview(userId, reviewId);

      // Assert
      expect(reviewRepository.delete).toHaveBeenCalledWith(reviewId);
      expect(result.id).toBe(reviewId);
    });

    it('리뷰가 없으면 NotFoundError 발생', async () => {
      reviewRepository.findById.mockResolvedValue(null);

      await expect(reviewService.deleteReview(userId, reviewId)).rejects.toThrow(NotFoundError);
    });

    it('작성자가 아니면 ForbiddenError 발생', async () => {
      const existingReview = mockReviewWithDetail({ id: reviewId, userId: otherUserId });
      reviewRepository.findById.mockResolvedValue(existingReview);

      await expect(reviewService.deleteReview(userId, reviewId)).rejects.toThrow(ForbiddenError);
    });
  });
});
