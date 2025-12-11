import { PrismaClient } from '@prisma/client';
import {
  CreateCartRawData,
  GetCartItemDetailRawData,
  GetCartRawData,
  UpdateCartRawData,
  UpdateRepoInput,
} from '@/domains/cart/cart.dto.js';

export class CartRepository {
  constructor(private prisma: PrismaClient) {}
  async findCartIdByUserId(userId: string) {
    return await this.prisma.cart.findUnique({
      where: {
        buyerId: userId,
      },
      select: {
        id: true,
      },
    });
  }
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
                createdAt: true,
                updatedAt: true,
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
  async updateCart({
    tx,
    cartId,
    productId,
    sizeId,
    quantity,
  }: UpdateRepoInput): Promise<UpdateCartRawData> {
    const db = tx ?? this.prisma;
    return await db.cartItem.upsert({
      where: {
        cartId_productId_sizeId: {
          cartId,
          productId,
          sizeId,
        },
      },
      update: {
        quantity: quantity,
      },
      create: {
        cartId,
        productId,
        sizeId,
        quantity,
      },
    });
  }
  // 아이템 존재 여부 확인
  async findCartItem(cartItemId: string) {
    return await this.prisma.cartItem.findUnique({
      where: {
        id: cartItemId,
      },
      select: {
        id: true,
      },
    });
  }
  async findCartItemDetail(cartItemId: string): Promise<GetCartItemDetailRawData | null> {
    return await this.prisma.cartItem.findUnique({
      where: {
        id: cartItemId,
      },
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
            createdAt: true,
            updatedAt: true,
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
        cart: {
          select: {
            id: true,
            buyerId: true,
            quantity: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }
  async deleteCartItem(cartItemId: string) {
    return await this.prisma.cartItem.delete({
      where: {
        id: cartItemId,
      },
      select: {
        cart: {
          select: {
            buyerId: true,
          },
        },
      },
    });
  }
}
