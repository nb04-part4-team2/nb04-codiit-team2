import { PrismaClient } from '@prisma/client';
import { CreateCartRawData, GetCartRawData } from '@/domains/cart/cart.dto.js';

export class CartRepository {
  constructor(private prisma: PrismaClient) {}
  async findByUserId(userId: string): Promise<GetCartRawData | null> {
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
                    userId: true,
                    name: true,
                    address: true,
                    detailAddress: true,
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
                        en: true,
                        ko: true,
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
  async createCart(userId: string): Promise<CreateCartRawData> {
    return await this.prisma.cart.upsert({
      where: {
        buyerId: userId,
      },
      update: {},
      create: {
        buyerId: userId,
        quantity: 0,
      },
      select: {
        id: true,
        buyerId: true,
        quantity: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
