import { CartBase, CartItemRawData, CartItemResponse } from '@/domains/cart/cart.type.js';

// db 조회 결과
export interface GetCartRawData extends CartBase<Date> {
  items: CartItemRawData[];
}

export type CreateCartRawData = CartBase<Date>;

// response
export interface GetCartResponse extends CartBase<string> {
  items: CartItemResponse[];
}

export type CreateCartResponse = CartBase<string>;
