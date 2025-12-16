import { PrismaClient, Prisma } from '@prisma/client';
import { CreateReviewDto } from './review.dto.js';

// 상세 조회 시 사용할 include 옵션 정의
const reviewDetailInclude = {
  user: {
    select: { name: true },
  },
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

  // 리뷰 생성
  async create(userId: string, productId: string, data: CreateReviewDto) {
    return this.prisma.review.create({
      data: {
        userId,
        productId,
        orderItemId: data.orderItemId,
        rating: data.rating,
        content: data.content,
      },
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
      include: {
        user: {
          select: { name: true }, // 유저 이름만 선택적으로 가져옴
        },
      },
    });
  }

  // 특정 상품의 총 리뷰 개수 조회
  async countByProductId(productId: string) {
    return this.prisma.review.count({
      where: { productId },
    });
  }
}
