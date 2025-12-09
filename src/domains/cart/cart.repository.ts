import { PrismaClient } from '@prisma/client';

export class CartRepository {
  constructor(private prisma: PrismaClient) {}
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
                    userId: true,
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
}
