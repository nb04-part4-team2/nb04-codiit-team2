import { SizeRawData } from '@/domains/cart/cart.type.js';
import {
  CreateOrderRawData,
  CreateOrderResponseData,
  GetOrderRawData,
  GetOrderResponseData,
  GetOrdersRawData,
  GetOrdersResponseData,
} from '@/domains/order/order.dto.js';
import {
  GetOrderItemRawData,
  GetOrderItemResponseData,
  MetaBase,
  OrderBase,
  OrderItemBase,
  OrderItemSizeResponse,
  PaymentRawData,
  PaymentResponse,
  ProductRawData,
  ProductResponse,
  ReviewRawData,
  ReviewResponse,
} from '@/domains/order/order.type.js';
import { InternalServerError } from '@/common/utils/errors.js';
import { buildPaymentStatus } from '@/domains/order/order.utils.js';

// 주문 목록 조회 mapper input
// type <-> dto 순환 참조 문제 때문에 type.ts에서 이동
export interface GetOrdersMapperInput extends MetaBase {
  rawOrders: GetOrdersRawData;
  totalCount: number;
}

const toOrderBaseResponse = (order: OrderBase<Date>): OrderBase<string> => ({
  id: order.id,
  name: order.name,
  phoneNumber: order.phoneNumber,
  address: order.address,
  subtotal: order.subtotal,
  totalQuantity: order.totalQuantity,
  usePoint: order.usePoint,
  createdAt: order.createdAt.toISOString(),
});

const toOrderItemBaseResponse = (orderItem: OrderItemBase): OrderItemBase => ({
  id: orderItem.id,
  price: orderItem.price,
  quantity: orderItem.quantity,
  productId: orderItem.productId,
});

const toReviewResponse = (review: ReviewRawData): ReviewResponse => ({
  id: review.id,
  rating: review.rating,
  content: review.content,
  createdAt: review.createdAt.toISOString(),
});

const toPaymentResponse = (payment: PaymentRawData): PaymentResponse => ({
  id: payment.id,
  orderId: payment.orderId,
  price: payment.price,
  status: payment.status,
  createdAt: payment.createdAt.toISOString(),
  updatedAt: payment.updatedAt.toISOString(),
});

const toProductResponse = (
  product: ProductRawData,
  reviews: ReviewResponse[],
): ProductResponse => ({
  name: product.name,
  image: product.image,
  reviews: reviews,
});

const toSizeResponse = (size: SizeRawData): OrderItemSizeResponse => ({
  id: size.id,
  size: {
    en: size.en,
    ko: size.ko,
  },
});

const toOrderItemResponse = (orderItemRawData: GetOrderItemRawData): GetOrderItemResponseData => {
  const { review, product, size, ...rest } = orderItemRawData;
  return {
    ...toOrderItemBaseResponse(rest),
    product: toProductResponse(product, review ? [toReviewResponse(review)] : []),
    size: toSizeResponse(size),
    isReviewed: !!review,
  };
};
/**
 * GET - /api/orders/{orderId} 주문 상세 조회 Response
 * POST - /api/orders 주문 생성 Response
 * PATCH - /api/orders/{orderId} 주문 수정 Response
 */
export const toOrderResponse = (rawOrder: GetOrderRawData): GetOrderResponseData => {
  if (!rawOrder.payments) {
    console.error(`[Critical] Order ${rawOrder.id} has NO payment record!`);
    throw new InternalServerError('주문에 연결된 결제 정보가 없습니다.');
  }
  return {
    ...toOrderBaseResponse(rawOrder),
    paymentStatus: buildPaymentStatus(rawOrder.payments),
    orderItems: rawOrder.orderItems.map(toOrderItemResponse),
    payments: rawOrder.payments.map(toPaymentResponse),
  };
};
/**
 * GET - /api/orders 주문 목록 조회 Response
 */
export const toGetOrdersResponse = ({
  rawOrders,
  totalCount,
  page,
  limit,
}: GetOrdersMapperInput): GetOrdersResponseData => {
  return {
    data: rawOrders.map(toOrderResponse),
    meta: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};
/**
 * POST - /api/orders 주문 생성 Response
 * @deprecated 주문 생성 response를 프론트에서 사용하지 않고, 리스폰스를 임의로 지정하면 된다고 해 swagger에 따름
 */
export const toCreateOrderResponse = (rawOrder: CreateOrderRawData): CreateOrderResponseData => ({
  ...toOrderBaseResponse(rawOrder),
  userId: rawOrder.buyerId,
  updatedAt: rawOrder.createdAt.toISOString(), // 주문 생성 api에서만 요구하는 필드
  // 굳이 스키마에 updatedAt 추가할 필요 없어보임
});
