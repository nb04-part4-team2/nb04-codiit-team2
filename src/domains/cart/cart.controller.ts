import { NextFunction, Request, Response } from 'express';
import { CartService } from '@/domains/cart/cart.service.js';
import { UnauthorizedError } from '@/common/utils/errors.js';

export class CartController {
  constructor(private cartService: CartService) {}
  getCart = async (req: Request, res: Response, _next: NextFunction) => {
    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const { id: userId } = req.user;
    const result = await this.cartService.getCart(userId);

    return res.status(200).json(result);
  };
}
