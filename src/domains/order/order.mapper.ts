import { toProductResponse } from '../cart/cart.mapper.js';
import { SizeRawData, SizeResponse } from '../cart/cart.type.js';
import { GetOrderRawData, GetOrderResponseData } from './order.dto.js';
import {
  GetOrderItemRawData,
  GetOrderItemResponseData,
  OrderBase,
  OrderItemBase,
} from './order.type.js';

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

const toSizeResponse = (size: SizeRawData): SizeResponse => ({
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
    product: toProductResponse(product),
    size: toSizeResponse(size),
    isReviewed: !!review,
  };
};

export const toOrderResponse = (rawOrder: GetOrderRawData): GetOrderResponseData => ({
  ...toOrderBaseResponse(rawOrder),
  orderItems: rawOrder.orderItems.map(toOrderItemResponse),
});
