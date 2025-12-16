import {
  CreateOrderItemRepoInput,
  CreateOrderRepoInput,
  CreateOrderServiceInput,
  CreatePaymentRepoInput,
} from '@/domains/order/order.dto.js';
import { OrderRepository } from '@/domains/order/order.repository.js';
import { PaymentStatus, PrismaClient } from '@prisma/client';
import { CreateOrderItemInputWithPrice } from '@/domains/order/order.type.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@/common/utils/errors.js';

export class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private prisma: PrismaClient,
  ) {}
  async getOrder(userId: string, orderId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('주문을 찾을 수 없습니다.');
    }
    if (order.buyerId !== userId) {
      throw new ForbiddenError('접근 권한이 없습니다.');
    }
    return order;
  }
  async createOrder({
    userId,
    name,
    phone,
    address,
    usePoint,
    orderItems,
  }: CreateOrderServiceInput) {
    let orderData = {} as CreateOrderRepoInput;
    let orderItemsData = [] as CreateOrderItemRepoInput[];
    let paymentData = {} as CreatePaymentRepoInput;
    // 사전 체크 (사용할 포인트가 현재 유저가 가지고 있는 총 포인트보다 같거나 작은지)
    // 프론트에서 이미 막히지만 방어적 코드
    const user = await this.orderRepository.findUserPoint(userId);
    if (!user) {
      throw new UnauthorizedError('사용자를 찾을 수 없습니다.');
    }
    if (usePoint > user.point) {
      // 유저가 보유한 포인트보다 사용하려는 포인트가 많은 경우
      throw new BadRequestError('잘못된 요청입니다.');
    }
    // 0. 주문 생성에 필요한 데이터들 추출
    const productIds = orderItems.map((item) => item.productId);
    const products = await this.orderRepository.findManyProducts(productIds);
    const buildedData = orderItems.reduce(
      (acc, item) => {
        // 상품 존재 여부 체크 (방어코드)
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          throw new NotFoundError('상품 없음');
        }
        // 재고 수량 검증 (방어코드)
        const stock = product.stocks.find((stock) => stock.sizeId === item.sizeId);
        if (!stock || stock.quantity < item.quantity) {
          throw new BadRequestError(`'${product.name}' 상품의 재고가 부족합니다.`);
        }
        acc.subtotal += product.price * item.quantity; // 상품 총액
        acc.totalQuantity += item.quantity; // 총 주문 수량
        acc.matchedOrderItems.push({
          productId: item.productId,
          sizeId: item.sizeId,
          quantity: item.quantity,
          price: product.price,
        }); // 주문 아이템에 price 추가해서 조립
        return acc;
      },
      { subtotal: 0, totalQuantity: 0, matchedOrderItems: [] as CreateOrderItemInputWithPrice[] },
    );

    // 1. 주문 생성
    return await this.prisma.$transaction(async (tx) => {
      // 1-1 . 주문 생성
      orderData = {
        userId,
        name,
        phone,
        address,
        usePoint,
        subtotal: buildedData.subtotal,
        totalQuantity: buildedData.totalQuantity,
      };
      const order = await this.orderRepository.createOrder(orderData, tx);

      // 1-2. 주문 아이템들 생성 및 주문에 연결
      orderItemsData = buildedData.matchedOrderItems.map((orderItem) => ({
        ...orderItem,
        orderId: order.id,
      }));
      await this.orderRepository.createOrderItems(orderItemsData, tx);

      // 1-3. 포인트를 사용한 경우 포인트 차감
      if (usePoint > 0) {
        // 1-3-1. 포인트 차감
        await this.orderRepository.updatePoint({ userId, usePoint }, tx);
        // 1-3-2. 포인트 히스토리 생성
        await this.orderRepository.createPointHistory({ userId, orderId: order.id, usePoint }, tx);
      }

      // 1-4. payment 생성 및 연결
      // 현재는 임의로 completedPayment 상태로 그냥 생성하는 것 같음
      // 실제로 외부 결제모듈을 연결한다면 어떻게 하는건지 우리 프로젝트에 실제로 결제 되도록 적용 가능한지 검토 필요
      const finalPaymentPrice = buildedData.subtotal - usePoint; // 결제 금액은 총액 - 포인트 사용액
      if (finalPaymentPrice < 0) {
        throw new BadRequestError('사용 포인트가 상품 총액을 초과할 수 없습니다.');
      }
      paymentData = {
        orderId: order.id,
        price: finalPaymentPrice,
        status: PaymentStatus.CompletedPayment,
      };
      await this.orderRepository.createPayment(paymentData, tx);

      // 1-5. 재고 감소 처리
      const stockUpdatePromises = buildedData.matchedOrderItems.map(async (orderItem) => {
        const stockData = {
          productId: orderItem.productId,
          sizeId: orderItem.sizeId,
          quantity: orderItem.quantity,
        };
        return await this.orderRepository.updateStock(stockData, tx);
      });
      await Promise.all(stockUpdatePromises);
      // 장바구니 삭제는 따로 안하는 것 같음
      // 주문 성공 후 프론트쪽에서 /api/cart/{cartId} delete로 주문이 들어간 아이템들만 삭제 요청 보내는 것 확인
      // 유저의 장바구니가 생성되면 삭제하지 않고 주문할 때마다 주문한 아이템들만 삭제하는 방식인 것 같음
      return order;
    });
  }
}
