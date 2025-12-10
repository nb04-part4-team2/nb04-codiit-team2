import { CartBase, CartItemRawData, CartItemResponse } from '@/domains/cart/cart.type.js';

// 장바구니 조회
// db 조회 결과
export interface RawCartData extends CartBase<Date> {
  items: CartItemRawData[];
}

// response
export interface CartResponse extends CartBase<string> {
  items: CartItemResponse[];
}
