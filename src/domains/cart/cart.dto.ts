import {
  CartBase,
  CartItemBase,
  GetCartItemRawData,
  GetCartItemResponse,
} from '@/domains/cart/cart.type.js';
import { Prisma } from '@prisma/client';
import { UpdateCartBody } from '@/domains/cart/cart.schema.js';

// update input
// z.infer로 단일 진실 공급원 준수
export interface UpdateServiceInput extends UpdateCartBody {
  userId: string;
}
export interface UpdateRepoInput {
  tx?: Prisma.TransactionClient;
  cartId: string;
  productId: string;
  sizeId: number;
  quantity: number;
}

// db 조회 결과
export interface GetCartRawData extends CartBase<Date> {
  items: GetCartItemRawData[];
}

export type CreateCartRawData = CartBase<Date>;

export type UpdateCartRawData = CartItemBase<Date>;

// response
export interface GetCartResponse extends CartBase<string> {
  items: GetCartItemResponse[];
}

export type CreateCartResponse = CartBase<string>;

export type UpdateCartResponse = CartItemBase<string>;
