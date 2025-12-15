import { PaymentStatus } from '@prisma/client';
import { CreateOrderBody, CreateOrderItemBody } from '@/domains/order/order.schema.js';
import {
  CreateOrderItemInputWithPrice,
  GetOrderItemRawData,
  GetOrderItemResponseData,
  OrderBase,
} from '@/domains/order/order.type.js';

// Repo input
export interface CreateOrderRepoInput extends Omit<CreateOrderBody, 'orderItems'> {
  userId: string;
  subtotal: number;
  totalQuantity: number;
}

export interface CreateOrderItemRepoInput extends CreateOrderItemInputWithPrice {
  orderId: string;
}

export interface CreatePaymentRepoInput {
  price: number;
  status: PaymentStatus;
  orderId: string;
}

export interface UpdatePointRepoInput {
  userId: string;
  usePoint: number;
}

export interface createPointHistoryRepoInput extends UpdatePointRepoInput {
  orderId: string;
}

export type UpdateStockRepoInput = CreateOrderItemBody;

// repo output
export interface GetOrderRawData extends OrderBase<Date> {
  orderItems: GetOrderItemRawData[];
}

// service
export interface CreateOrderServiceInput extends CreateOrderBody {
  userId: string;
}

// response
export interface GetOrderResponseData extends OrderBase<string> {
  orderItems: GetOrderItemResponseData[];
}
