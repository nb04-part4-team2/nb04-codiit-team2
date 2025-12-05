import { CartRepository } from '@/domains/cart/cart.repository.js';
import { ForbiddenError, NotFoundError } from '@/common/utils/errors.js';
import { UserType } from '@prisma/client';

export class CartService {
  private cartRepository;
  constructor(cartRepository?: CartRepository) {
    this.cartRepository = cartRepository || new CartRepository();
  }
  async getCart(userId: string, userType: UserType) {
    if (userType === UserType.SELLER) {
      throw new ForbiddenError('접근 권한이 없습니다.');
    }
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundError('요청한 리소스를 찾을 수 없습니다.');
    }
    return cart;
  }
}
