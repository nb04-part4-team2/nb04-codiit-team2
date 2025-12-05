import { NextFunction, Request, Response } from 'express';
import { CartService } from '@/domains/cart/cart.service.js';
import { UserType } from '@prisma/client';
// import { getCartUserSchema } from '@/domains/cart/cart.schema.js';

export class CartController {
  private cartService;
  constructor(cartService?: CartService) {
    this.cartService = cartService || new CartService();
  }
  getCart = async (req: Request, res: Response, _next: NextFunction) => {
    // req.user는 body, query, params도 아니어서 어떻게 써야하나 싶네요
    // const {userId, userType} = getCartUserSchema.parse(req.user);
    const userId = 'testBuyer1'; // 유저 기능 구현 후 제거
    const userType = UserType.BUYER; // 유저 기능 구현 후 제거
    const result = await this.cartService.getCart(userId, userType);
    // -> userId, userType도 객체로 인터페이스 쌓을 수 있을 것 같은데 일단 user domain 내용 같아서 그렇게 하지는 않았습니다
    return res.status(200).json(result);
  };
}
