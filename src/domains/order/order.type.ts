import { ProductRawData, ProductResponse, SizeRawData, SizeResponse } from '../cart/cart.type.js';
import { CreateOrderItemBody } from './order.schema.js';

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

interface ReviewRawData {
  id: string;
}

interface ReviewResponse {
  isReviewed: boolean;
}

export interface CreateOrderItemInputWithPrice extends CreateOrderItemBody {
  price: number;
}

interface GetOrderItemBase<TProduct, TSize> extends OrderItemBase {
  product: TProduct;
  size: TSize;
}

// db 조회 결과 RawData type
export interface GetOrderItemRawData extends GetOrderItemBase<ProductRawData, SizeRawData> {
  review: ReviewRawData | null;
}

// response 응답용 data type
export interface GetOrderItemResponseData
  extends GetOrderItemBase<ProductResponse, SizeResponse>, ReviewResponse {}
