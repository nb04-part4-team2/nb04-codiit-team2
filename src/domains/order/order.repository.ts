import { Prisma, PrismaClient } from '@prisma/client';
import {
  CreateOrderItemRepoInput,
  CreateOrderRawData,
  CreateOrderRepoInput,
  CreatePaymentRepoInput,
  CreatePointHistoryRepoInput,
  GetOrderRawData,
  UpdatePointRepoInput,
  UpdateStockRepoInput,
} from '@/domains/order/order.dto.js';

export class OrderRepository {
  constructor(private prisma: PrismaClient) {}
  // order 오리지널 쿼리들
  /**
   * 주문 조회
   **/
  async findById(orderId: string): Promise<GetOrderRawData | null> {
    return await this.prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        buyerId: true,
        name: true,
        phoneNumber: true,
        address: true,
        subtotal: true,
        totalQuantity: true,
        usePoint: true,
        createdAt: true,
        orderItems: {
          select: {
            id: true,
            price: true,
            quantity: true,
            productId: true,
            review: {
              // isReviewed, product내부 reviews 생성용
              select: {
                id: true,
                rating: true,
                content: true,
                createdAt: true,
              },
            },
            product: {
              select: {
                name: true,
                image: true,
              },
            },
            size: {
              select: {
                id: true,
                en: true,
                ko: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            price: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
  }
  /**
   * 주문 생성
   **/
  async createOrder(
    data: CreateOrderRepoInput,
    tx?: Prisma.TransactionClient,
  ): Promise<CreateOrderRawData> {
    const db = tx ?? this.prisma;
    return await db.order.create({
      data: {
        buyerId: data.userId,
        name: data.name,
        phoneNumber: data.phone,
        address: data.address,
        usePoint: data.usePoint,
        subtotal: data.subtotal,
        totalQuantity: data.totalQuantity,
      },
    });
  }
  // 다른 도메인 쿼리들
  /**
   * 유저 포인트 조회
   **/
  async findUserPoint(userId: string) {
    return await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        point: true,
      },
    });
  }
  /**
   * 상품 가격, 재고 조회
   **/
  async findManyProducts(productIds: string[]) {
    return await this.prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        stocks: {
          select: {
            sizeId: true,
            quantity: true,
          },
        },
      },
    });
  }
  /**
   * 주문 아이템들 생성
   **/
  async createOrderItems(data: CreateOrderItemRepoInput[], tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return await db.orderItem.createMany({
      data,
    });
  }
  /**
   * 결제 정보 생성
   **/
  async createPayment(data: CreatePaymentRepoInput, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return await db.payment.create({
      data,
    });
  }
  /**
   * 포인트 차감
   **/
  async updatePoint({ userId, usePoint }: UpdatePointRepoInput, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return await db.user.update({
      where: {
        id: userId,
        point: { gte: usePoint }, // 방어적 코드 - 현재 포인트가 사용할 포인트보다 많을 때만
      },
      data: {
        point: { decrement: usePoint },
      },
    });
  }
  /**
   * 포인트 히스토리 생성
   **/
  async createPointHistory(
    { userId, orderId, usePoint }: CreatePointHistoryRepoInput,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    return await db.pointHistory.create({
      data: {
        userId: userId,
        orderId: orderId,
        amount: usePoint,
        type: 'use', // 이부분은 따로 enum타입 같은게 없어서 논의 해봐야 할 것 같습니다.
      },
    });
  }
  /**
   * 재고 감소 처리
   **/
  async updateStock(
    { productId, sizeId, quantity }: UpdateStockRepoInput,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    return await db.stock.update({
      where: {
        productId_sizeId: {
          productId,
          sizeId,
        },
        quantity: {
          gte: quantity,
        },
      },
      data: {
        quantity: { decrement: quantity },
      },
    });
  }
}
