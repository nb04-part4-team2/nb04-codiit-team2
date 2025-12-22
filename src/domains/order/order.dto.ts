import { OrderStatus, PaymentStatus } from '@prisma/client';
import {
  CreateOrderBody,
  CreateOrderItemBody,
  OrderQuery,
  UpdateOrderBody,
} from '@/domains/order/order.schema.js';
import {
  CreateOrderItemInputWithPrice,
  GetOrderItemRawData,
  GetOrderItemResponseData,
  MetaResponse,
  OrderBase,
  PaymentRawData,
  PaymentResponse,
  PointHistoryBase,
} from '@/domains/order/order.type.js';

// ============================================
// Repo input
// ============================================
// order 오리지널
// 주문 개수 조회 repo input dto
export interface GetCountRepoInput {
  buyerId: string;
  status: OrderStatus;
}
// 주문 생성 repo input dto
export interface CreateOrderRepoInput extends Omit<CreateOrderBody, 'orderItems'> {
  userId: string;
  subtotal: number;
  totalQuantity: number;
}
// 주문 수정 repo input dto
export interface UpdateOrderRepoInput extends UpdateOrderBody {
  orderId: string;
}
// 주문 목록 조회 repo input dto
export interface GetOrdersRepoInput extends GetCountRepoInput {
  skip: number;
  take: number;
}

// 외부 레포
// 주문 아이템 repo input dto
export interface CreateOrderItemRepoInput extends CreateOrderItemInputWithPrice {
  orderId: string;
}
// 결제 정보 repo input dto
export interface CreatePaymentRepoInput {
  price: number;
  status: PaymentStatus;
  orderId: string;
}
// 유저(포인트용) repo input dto
export interface UpdatePointRepoInput {
  userId: string;
  amount: number;
}
// 포인트 히스토리 생성 repo input dto
export interface CreatePointHistoryRepoInput extends UpdatePointRepoInput, PointHistoryBase {}
// 포인트 히스토리 조회 repo input dto
export interface GetPointHistoryRepoInput extends PointHistoryBase {
  userId: string;
}
// 재고 repo input dto
export type UpdateStockRepoInput = CreateOrderItemBody;

// ============================================
// repo output
// ============================================
// 주문 조회 repo output dto
export interface GetOrderRawData extends OrderBase<Date> {
  buyerId: string;
  orderItems: GetOrderItemRawData[];
  payments: PaymentRawData | null;
}
// 주문 목록 조회 repo output dto
export type GetOrdersRawData = GetOrderRawData[];
// 주문 생성 repo output dto
/**
 * @deprecated create 쿼리 반환 dto - 현재 미사용
 */
export interface CreateOrderRawData extends OrderBase<Date> {
  buyerId: string;
}

// ============================================
// service input
// ============================================
// 주문 생성 service input dto
export interface CreateOrderServiceInput extends CreateOrderBody {
  userId: string;
}
// 주문 수정 service input dto
export interface UpdateOrderServiceInput extends UpdateOrderBody {
  userId: string;
  orderId: string;
}
// 주문 목록 조회 service input dto
export interface GetOrdersServiceInput extends OrderQuery {
  userId: string;
}

// ============================================
// controller response (매퍼에서 사용)
// ============================================
// 주문 조회 response
export interface GetOrderResponseData extends OrderBase<string> {
  orderItems: GetOrderItemResponseData[];
  payments: PaymentResponse;
}
// 주문 목록조회 response
export interface GetOrdersResponseData {
  data: GetOrderResponseData[];
  meta: MetaResponse;
}
// 주문 생성 response
/**
 * @deprecated create 결과 최종 리턴 dto - 현재 미사용
 */
export interface CreateOrderResponseData extends OrderBase<string> {
  userId: string;
  updatedAt: string;
}
