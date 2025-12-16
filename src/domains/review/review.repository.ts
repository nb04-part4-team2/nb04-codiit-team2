import { PrismaClient } from '@prisma/client';
import { CreateReviewDto } from './review.dto.js';

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
}
