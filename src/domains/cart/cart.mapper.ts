import { CartResponse, RawCartData } from '@/domains/cart/cart.dto.js';
import {
  CartItemRawData,
  CartItemResponse,
  ProductRawData,
  ProductResponse,
  StockRawData,
  StockResponse,
  StoreRawData,
  StoreResponse,
} from '@/domains/cart/cart.type.js';
import { toStoreResponse } from '../store/store.mapper.js';

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
const getStoreResponse = (storeRawData: StoreRawData): StoreResponse => {
  // 매개변수 타입 일치용 더미 데이터 추가
  const storeWithDummy = { ...storeRawData, detailAddress: null };
  const { detailAddress: _detailAddress, ...store } = toStoreResponse(storeWithDummy);
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
  store: getStoreResponse(productRawData.store),
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

// ============================================
// 장바구니 조회 응답 객체 변환
// ============================================
export const toCartResponse = (rawCart: RawCartData): CartResponse => ({
  id: rawCart.id,
  buyerId: rawCart.buyerId,
  quantity: rawCart.quantity,
  createdAt: rawCart.createdAt.toISOString(),
  updatedAt: rawCart.updatedAt.toISOString(),
  items: rawCart.items.map(toItemResponse),
});
