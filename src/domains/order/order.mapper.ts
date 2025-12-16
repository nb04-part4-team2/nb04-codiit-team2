import { SizeRawData } from '@/domains/cart/cart.type.js';
import {
  CreateOrderRawData,
  CreateOrderResponseData,
  GetOrderRawData,
  GetOrderResponseData,
} from '@/domains/order/order.dto.js';
import {
  GetOrderItemRawData,
  GetOrderItemResponseData,
  OrderBase,
  OrderItemBase,
  OrderItemSizeResponse,
  ProductRawData,
  ProductResponse,
  ReviewRawData,
  ReviewResponse,
} from '@/domains/order/order.type.js';

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
 */
export const toGetOrderResponse = (rawOrder: GetOrderRawData): GetOrderResponseData => ({
  ...toOrderBaseResponse(rawOrder),
  orderItems: rawOrder.orderItems.map(toOrderItemResponse),
});
/**
 * POST - /api/orders 주문 생성 Response
 */
export const toCreateOrderResponse = (rawOrder: CreateOrderRawData): CreateOrderResponseData => ({
  ...toOrderBaseResponse(rawOrder),
  userId: rawOrder.buyerId,
  updatedAt: rawOrder.createdAt.toISOString(), // 주문 생성 api에서만 요구하는 필드
  // 굳이 스키마에 updatedAt 추가할 필요 없어보임
});
