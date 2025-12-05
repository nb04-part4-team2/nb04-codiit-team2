import { Router } from 'express';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { CartController } from '@/domains/cart/cart.controller.js';

const cartRouter = Router();
const cartController = new CartController();

// 인증 추가시 auth에서 userId 추출
// 임시로 userId 하드 코딩
// cartRouter.get('/', authentication, asyncHandler(cartController.getCart));
cartRouter.get('/', asyncHandler(cartController.getCart));

export default cartRouter;
