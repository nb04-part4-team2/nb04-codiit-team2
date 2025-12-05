import prisma from '@/config/prisma.js';
import { PrismaClient } from '@prisma/client';

export class CartRepository {
  private prisma;
  constructor(receivedPrisma?: PrismaClient) {
    this.prisma = receivedPrisma || prisma;
  }
  async findByUserId(userId: string) {
    return await this.prisma.cart.findUnique({
      where: {
        buyerId: userId,
      },
      select: {
        id: true,
        buyerId: true,
        quantity: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            cartId: true,
            productId: true,
            sizeId: true,
            quantity: true,
            createdAt: true,
            updatedAt: true,
            product: {
              select: {
                id: true,
                storeId: true,
                name: true,
                price: true,
                image: true,
                discountRate: true,
                discountStartTime: true,
                discountEndTime: true,
                store: {
                  select: {
                    id: true,
                    sellerId: true, // swagger 명세서 에서는 userId -> 일단 진행
                    name: true,
                    address: true,
                    phoneNumber: true,
                    content: true,
                    image: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
                stocks: {
                  select: {
                    id: true,
                    productId: true,
                    sizeId: true,
                    quantity: true,
                    size: {
                      select: {
                        id: true,
                        size: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
