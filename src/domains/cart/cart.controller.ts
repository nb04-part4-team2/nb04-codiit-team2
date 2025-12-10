import { Request, Response } from 'express';
import { CartService } from '@/domains/cart/cart.service.js';
import { UnauthorizedError } from '@/common/utils/errors.js';
import { toCreateCartResponse, toGetCartResponse } from '@/domains/cart/cart.mapper.js';

export class CartController {
  constructor(private cartService: CartService) {}
  getCart = async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const { id: userId } = req.user;
    const cart = await this.cartService.getCart(userId);
    if (Array.isArray(cart)) {
      return res.status(200).json([]);
    }
    return res.status(200).json(toGetCartResponse(cart));
  };
  createCart = async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const { id: userId } = req.user;
    const cart = await this.cartService.createCart(userId);
    return res.status(201).json(toCreateCartResponse(cart));
  };
}
