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

export interface CreatePointHistoryRepoInput extends UpdatePointRepoInput {
  orderId: string;
}

export type UpdateStockRepoInput = CreateOrderItemBody;

// repo output
export interface GetOrderRawData extends OrderBase<Date> {
  buyerId: string;
  orderItems: GetOrderItemRawData[];
}

export interface CreateOrderRawData extends OrderBase<Date> {
  buyerId: string;
}

// service
export interface CreateOrderServiceInput extends CreateOrderBody {
  userId: string;
}

// response
export interface GetOrderResponseData extends OrderBase<string> {
  orderItems: GetOrderItemResponseData[];
}

export interface CreateOrderResponseData extends OrderBase<string> {
  userId: string;
  updatedAt: string;
}
