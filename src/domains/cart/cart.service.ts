import { CartRepository } from '@/domains/cart/cart.repository.js';
import { NotFoundError } from '@/common/utils/errors.js';
import { CreateCartRawData, GetCartRawData } from '@/domains/cart/cart.dto.js';

export class CartService {
  constructor(private cartRepository: CartRepository) {}
  async getCart(userId: string): Promise<GetCartRawData> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundError('요청한 리소스를 찾을 수 없습니다.');
    }
    return cart;
  }
  async createCart(userId: string): Promise<CreateCartRawData> {
    const cart = await this.cartRepository.createCart(userId);
    return cart;
  }
}
