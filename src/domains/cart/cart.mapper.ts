import {
  GetCartResponse,
  GetCartRawData,
  CreateCartRawData,
  CreateCartResponse,
} from '@/domains/cart/cart.dto.js';
import {
  CartBase,
  CartItemRawData,
  CartItemResponse,
  ProductRawData,
  ProductResponse,
  StockRawData,
  StockResponse,
  StoreRawData,
  StoreResponse,
} from '@/domains/cart/cart.type.js';
import { toStoreResponse as getStoreResponse } from '@/domains/store/store.mapper.js';

// ============================================
// 응답 객체 조립용 부품들
// ============================================
const toStockResponse = (stock: StockRawData): StockResponse => ({
  id: stock.id,
  productId: stock.productId,
  sizeId: stock.sizeId,
  quantity: stock.quantity,
  size: {
    id: stock.size.id,
    size: {
      en: stock.size.en,
      ko: stock.size.ko,
    },
  },
});

// 반환 형태가 유사한 store.mapper.ts의 toStoreResponse 재사용
const toStoreResponse = (storeRawData: StoreRawData): StoreResponse => {
  const { detailAddress: _detailAddress, ...store } = getStoreResponse(storeRawData);
  return store;
};

const toProductResponse = (productRawData: ProductRawData): ProductResponse => ({
  id: productRawData.id,
  storeId: productRawData.storeId,
  name: productRawData.name,
  price: productRawData.price,
  image: productRawData.image,
  discountRate: productRawData.discountRate,
  discountStartTime: productRawData.discountStartTime?.toISOString() ?? null,
  discountEndTime: productRawData.discountEndTime?.toISOString() ?? null,
  store: toStoreResponse(productRawData.store),
  stocks: productRawData.stocks.map(toStockResponse),
});

const toItemResponse = (itemRawData: CartItemRawData): CartItemResponse => ({
  id: itemRawData.id,
  cartId: itemRawData.cartId,
  productId: itemRawData.productId,
  sizeId: itemRawData.sizeId,
  quantity: itemRawData.quantity,
  createdAt: itemRawData.createdAt.toISOString(),
  updatedAt: itemRawData.updatedAt.toISOString(),
  product: toProductResponse(itemRawData.product),
});

const toCartBaseResponse = (cart: CartBase<Date>): CartBase<string> => ({
  id: cart.id,
  buyerId: cart.buyerId,
  quantity: cart.quantity,
  createdAt: cart.createdAt.toISOString(),
  updatedAt: cart.updatedAt.toISOString(),
});

// ============================================
// 장바구니 조회 응답 객체 변환
// ============================================
export const toGetCartResponse = (rawCart: GetCartRawData): GetCartResponse => ({
  ...toCartBaseResponse(rawCart),
  items: rawCart.items.map(toItemResponse),
});
// ============================================
// 장바구니 생성 응답 객체 변환
// ============================================
export const toCreateCartResponse = (rawCart: CreateCartRawData): CreateCartResponse => {
  return toCartBaseResponse(rawCart);
};
