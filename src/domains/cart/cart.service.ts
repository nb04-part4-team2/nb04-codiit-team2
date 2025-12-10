import { CartRepository } from '@/domains/cart/cart.repository.js';
import { CreateCartRawData, GetCartRawData } from '@/domains/cart/cart.dto.js';
import { NotFoundError } from '@/common/utils/errors.js';

export class CartService {
  constructor(private cartRepository: CartRepository) {}
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
}
