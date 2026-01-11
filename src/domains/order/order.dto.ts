import { OrderStatus, PaymentStatus } from '@prisma/client';
import {
  CreateOrderBody,
  CreateOrderItemBody,
  OrderQuery,
  UpdateOrderBody,
} from '@/domains/order/order.schema.js';
import {
  CreateOrderItemInputWithPrice,
  ExpiredOrderItem,
  GetOrderItemRawData,
  GetOrderItemResponseData,
  GradeBase,
  MetaResponse,
  OrderBase,
  OrderFromPayment,
  PaymentRawData,
  PaymentResponse,
  PointHistoryBase,
  ProductBase,
  StockBase,
  StockProductRawData,
  StockSizeRawData,
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
  expiresAt: Date | null;
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
// 재고 조회 repo input dto
export type GetStockRepoInput = Omit<UpdateStockRepoInput, 'quantity'>;
// ============================================
// repo output
// ============================================
// 주문 조회 repo output dto
export interface GetOrderRawData extends OrderBase<Date> {
  buyerId: string;
  orderItems: GetOrderItemRawData[];
  payments: PaymentRawData[];
}
// 주문 목록 조회 repo output dto
export type GetOrdersRawData = GetOrderRawData[];
// 주문 생성 repo output dto
// /**
//  * @deprecated create 쿼리 반환 dto - 현재 미사용
//  */
export interface CreateOrderRawData extends OrderBase<Date> {
  buyerId: string;
}
// 주문 상태 조회 repo output dto
export interface GetOrderStatusRawData {
  status: OrderStatus;
}
// 외부 레포
// 상품 정보 RawData
export interface ProductInfoRawData extends Omit<ProductBase, 'image'> {
  id: string;
  price: number;
  discountRate: number;
  discountStartTime: Date | null;
  discountEndTime: Date | null;
  stocks: StockBase[];
}
// 상품 정보 목록 조회 repo output dto
export type GetProductsInfoRawData = ProductInfoRawData[];
// 유저 정보 repo output dto
export interface UserInfoRawData {
  point: number;
  grade: GradeBase;
}
// 상품 재고 감소 repo output dto
export interface DecreaseStockRawData extends StockBase {
  id: string;
  productId: string;
  product: StockProductRawData;
  size: StockSizeRawData;
}
// 만료된 주문 조회 repo output dto
export interface ExpiredOrderRawData {
  id: string;
  orderItems: ExpiredOrderItem[];
}

// 결제 테이블을 통해 주문 정보 조회 repo output dto
export interface GetOrderFromPaymentRawData {
  order: OrderFromPayment;
}
// 결제 상태 조회
export interface GetPaymentStatusRawData {
  status: PaymentStatus;
}
// 결제 금액 조회
export interface GetPaymentPriceRawData {
  price: number;
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
  paymentStatus: PaymentStatus;
  orderItems: GetOrderItemResponseData[];
  payments: PaymentResponse[];
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
