import { SizeRawData, SizeResponse } from '@/domains/cart/cart.type.js';
import { CreateOrderItemBody } from '@/domains/order/order.schema.js';
import { PaymentStatus, PointHistoryType } from '@prisma/client';

// 타입 베이스들
// 주문 베이스
export interface OrderBase<TDate> {
  id: string;
  name: string;
  phoneNumber: string;
  address: string;
  subtotal: number;
  totalQuantity: number;
  usePoint: number;
  createdAt: TDate;
}
// 주문 아이템 베이스
export interface OrderItemBase {
  id: string;
  price: number;
  quantity: number;
  productId: string;
}
// 상품 베이스
export interface ProductBase {
  name: string;
  image: string;
}
// 리뷰 베이스
export interface ReviewBase<TDate> {
  id: string;
  rating: number;
  content: string;
  createdAt: TDate;
}
// 결제 정보 베이스
export interface PaymentBase<TDate> {
  id: string;
  orderId: string;
  price: number;
  status: PaymentStatus;
  createdAt: TDate;
  updatedAt: TDate;
}
// 주문 아이템 조회 베이스
interface GetOrderItemBase<TProduct, TSize> extends OrderItemBase {
  product: TProduct;
  size: TSize;
}
// 메타 데이터 베이스
export interface MetaBase {
  page: number;
  limit: number;
}
// 포인트 히스토리 베이스
export interface PointHistoryBase {
  orderId: string;
  type: PointHistoryType;
}

// db 조회 결과 RawData들
// 상품 RawData
export type ProductRawData = ProductBase;
// 리뷰 RawData
export type ReviewRawData = ReviewBase<Date>;
// 결제정보 RawData
export type PaymentRawData = PaymentBase<Date>;
// 주문 아이템 RawData type
export interface GetOrderItemRawData extends GetOrderItemBase<ProductRawData, SizeRawData> {
  review: ReviewRawData | null;
}

// 응답 객체용 Response들
// 상품 Response
export interface ProductResponse extends ProductBase {
  reviews: ReviewResponse[];
}
// 리뷰 Response
export type ReviewResponse = ReviewBase<string>;
// 결제정보 Response
export type PaymentResponse = PaymentBase<string>;
// 주문 아이템 내부 리뷰 Response
interface OrderItemsReviewResponse {
  isReviewed: boolean;
}
// 주문 아이템 내부 사이즈 객체 Response
export type OrderItemSizeResponse = Omit<SizeResponse, 'name'>;
// 주문 아이템 조회 Response
export interface GetOrderItemResponseData
  extends GetOrderItemBase<ProductResponse, OrderItemSizeResponse>, OrderItemsReviewResponse {}
// 주문 목록 조회 메타데이터 Response
export interface MetaResponse extends MetaBase {
  total: number;
  totalPages: number;
}

// 그 외 객체 타입
// 주문 아이템 repo input 생성용 객체 타입
export interface CreateOrderItemInputWithPrice extends CreateOrderItemBody {
  price: number;
}
