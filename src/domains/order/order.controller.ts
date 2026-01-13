import { UnauthorizedError } from '@/common/utils/errors.js';
import { Request, Response } from 'express';
import { OrderService } from '@/domains/order/order.service.js';
import { toGetOrdersResponse, toOrderResponse } from '@/domains/order/order.mapper.js';
import { OrderQuery } from './order.schema.js';

export class OrderController {
  constructor(private orderService: OrderService) {}
  getOrder = async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const { id: userId } = req.user;
    const { orderId } = req.params;
    const order = await this.orderService.getOrder(userId, orderId);
    return res.status(200).json(toOrderResponse(order));
  };
  getOrders = async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const { id: userId } = req.user;
    const { status, limit, page } = req.query as unknown as OrderQuery;
    const { rawOrders, totalCount } = await this.orderService.getOrders({
      userId,
      status,
      limit,
      page,
    });
    return res.status(200).json(toGetOrdersResponse({ rawOrders, totalCount, page, limit }));
  };
  createOrder = async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    // 프론트에서 비로그인 유저가 구매 불가하게 막혀있음 (장바구니 담기, 구매하기 누를 시 로그인이 필요합니다 발생)
    // 일단 비회원 주문은 불가능 한 것 같음
    const { id: userId } = req.user;
    const { name, phone, address, usePoint, orderItems } = req.body;
    const order = await this.orderService.createOrder({
      userId,
      name,
      phone,
      address,
      usePoint,
      orderItems,
    });
    return res.status(201).json(toOrderResponse(order));
  };
  updateOrder = async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const { id: userId } = req.user;
    const { orderId } = req.params;
    const { name, phone, address } = req.body;
    const order = await this.orderService.updateOrder({
      userId,
      orderId,
      name,
      phone,
      address,
    });
    return res.status(200).json(toOrderResponse(order));
  };
  deleteOrder = async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const { id: userId } = req.user;
    const { orderId } = req.params;
    await this.orderService.deleteOrder(userId, orderId);
    return res.status(200).json({ message: '주문이 성공적으로 취소되고 포인트가 복구되었습니다.' });
  };
}
