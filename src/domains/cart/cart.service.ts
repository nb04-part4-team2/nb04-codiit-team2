import { CartRepository } from '@/domains/cart/cart.repository.js';
import { CreateCartRawData, GetCartRawData, UpdateServiceInput } from '@/domains/cart/cart.dto.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/common/utils/errors.js';
import { PrismaClient } from '@prisma/client';

export class CartService {
  constructor(
    private cartRepository: CartRepository,
    private prisma: PrismaClient,
  ) {}
  async getCart(userId: string): Promise<GetCartRawData | []> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      // 장바구니가 없으면 빈 배열 반환
      return [];
    } else if (cart.items.length === 0) {
      // 장바구니에 아이템이 없을 경우 404
      throw new NotFoundError('장바구니에 아이템이 없습니다.');
    }
    return cart;
  }
  async createCart(userId: string): Promise<CreateCartRawData> {
    const cart = await this.cartRepository.createCart(userId);
    return cart;
  }
  async updateCart({ userId, productId, sizes }: UpdateServiceInput) {
    const cart = await this.cartRepository.findCartIdByUserId(userId);
    if (!cart) {
      // 사용자가 구매하기 or 장바구니 담기를 누른 경우 프론트에서 createCart를 먼저 호출함
      // 그리고 swagger에 장바구니 수정부분 404가 없음
      throw new BadRequestError('잘못된 요청입니다.');
    }
    const { id: cartId } = cart;
    const updatedItems = await this.prisma.$transaction(async (tx) => {
      const updatePromises = sizes.map((item) => {
        const { sizeId, quantity } = item;
        return this.cartRepository.updateCart({ tx, cartId, productId, sizeId, quantity });
      });
      return await Promise.all(updatePromises);
    });
    return updatedItems;
  }
  async getCartItem(userId: string, cartItemId: string) {
    const item = await this.cartRepository.findCartItemDetail(cartItemId);
    if (!item) {
      throw new NotFoundError('장바구니에 아이템이 없습니다.');
    }
    if (item.cart.buyerId !== userId) {
      throw new ForbiddenError('권한이 없습니다.');
    }
    return item;
  }
  async deleteCartItem(userId: string, cartItemId: string) {
    const item = await this.cartRepository.findCartItem(cartItemId);
    if (!item) {
      throw new NotFoundError('장바구니에 아이템이 없습니다.');
    }
    const deletedItem = await this.cartRepository.deleteCartItem(cartItemId);
    if (deletedItem.cart.buyerId !== userId) {
      throw new ForbiddenError('권한이 없습니다.');
    }
  }
}
