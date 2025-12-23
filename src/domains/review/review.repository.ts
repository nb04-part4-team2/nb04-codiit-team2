import { PrismaClient, Prisma } from '@prisma/client';
import { CreateReviewDto } from './review.dto.js';

// 생성 및 수정 후 반환할 기본 데이터 구조 정의 (프론트엔드 ReviewData 대응)
const reviewBasicInclude = {
  user: {
    select: { name: true },
  },
} satisfies Prisma.ReviewInclude;

// 공통 타입 export
export type ReviewWithUser = Prisma.ReviewGetPayload<{
  include: typeof reviewBasicInclude;
}>;

// 상세 조회 시 사용할 include 옵션 정의
const reviewDetailInclude = {
  ...reviewBasicInclude,
  product: {
    select: { name: true },
  },
  orderItem: {
    include: {
      size: true,
      order: {
        select: { createdAt: true },
      },
    },
  },
} satisfies Prisma.ReviewInclude;

// include 옵션이 적용된 결과 타입을 추출하여 export
export type ReviewWithDetail = Prisma.ReviewGetPayload<{
  include: typeof reviewDetailInclude;
}>;
export class ReviewRepository {
  constructor(private prisma: PrismaClient) {}

  // 구매 내역(주문 아이템) 조회 - 유저 검증 및 상품 일치 여부 확인용
  async findOrderItemById(orderItemId: string) {
    return this.prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: {
          select: { buyerId: true }, // 구매자 ID 확인
        },
        review: {
          select: { id: true }, // 이미 작성된 리뷰가 있는지 확인
        },
      },
    });
  }

  // 상품 존재 여부 확인용 (Service에서 404 처리를 위함)
  async findProductById(productId: string) {
    return this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
  }

  // 상품의 리뷰 평점과 개수를 재계산하여 Product 테이블에 반영
  async syncProductStats(
    productId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    const stats = await tx.review.aggregate({
      where: { productId },
      _count: { id: true },
      _avg: { rating: true },
    });

    const reviewsCount = stats._count.id;

    // 별점 소수점 처리 (데이터 정밀도 제어)
    const reviewsRating = stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0;

    await tx.product.update({
      where: { id: productId },
      data: {
        reviewsCount,
        reviewsRating,
      },
    });
  }

  // 리뷰 생성
  async create(userId: string, productId: string, data: CreateReviewDto) {
    return this.prisma.$transaction(async (tx) => {
      // 리뷰 생성 (tx 사용)
      const review = await tx.review.create({
        data: {
          userId,
          productId,
          orderItemId: data.orderItemId,
          rating: data.rating,
          content: data.content,
        },
        include: reviewBasicInclude,
      });

      // 통계 업데이트 (tx 전달) -> 실패 시 위 review.create도 롤백됨
      await this.syncProductStats(productId, tx);

      return review;
    });
  }

  // 리뷰 상세 조회 (ID 기반)
  async findById(reviewId: string) {
    return this.prisma.review.findUnique({
      where: { id: reviewId },
      include: reviewDetailInclude,
    });
  }

  // 리뷰 목록 조회 (페이지네이션)
  async findAllByProductId(productId: string, skip: number, take: number) {
    return this.prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: reviewBasicInclude,
    });
  }

  // 특정 상품의 총 리뷰 개수 조회
  async countByProductId(productId: string) {
    return this.prisma.review.count({
      where: { productId },
    });
  }

  // 리뷰 수정
  async update(reviewId: string, data: Partial<Pick<CreateReviewDto, 'rating' | 'content'>>) {
    return this.prisma.$transaction(async (tx) => {
      // 리뷰 업데이트
      const updatedReview = await tx.review.update({
        where: { id: reviewId },
        data,
        include: reviewBasicInclude,
      });

      // 통계 업데이트
      await this.syncProductStats(updatedReview.productId, tx);

      return updatedReview;
    });
  }

  // 리뷰 삭제
  async delete(reviewId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 삭제할 리뷰의 productId를 알기 위해 먼저 조회하거나 delete의 리턴값을 활용
      // delete는 삭제된 레코드를 반환하므로 바로 productId를 알 수 있음!
      const deletedReview = await tx.review.delete({
        where: { id: reviewId },
      });

      // 통계 업데이트
      await this.syncProductStats(deletedReview.productId, tx);

      return deletedReview;
    });
  }
}
