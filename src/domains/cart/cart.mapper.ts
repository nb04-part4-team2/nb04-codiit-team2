import {
  GetCartResponse,
  GetCartRawData,
  CreateCartRawData,
  CreateCartResponse,
  UpdateCartRawData,
  UpdateCartResponse,
  GetCartItemDetailRawData,
  GetCartItemDetailResponse,
} from '@/domains/cart/cart.dto.js';
import {
  CartBase,
  CartItemBase,
  GetCartItemRawData,
  GetCartItemResponse,
  ProductRawData,
  ProductResponse,
  StockRawData,
  StockResponse,
  StoreRawData,
  StoreResponse,
} from '@/domains/cart/cart.type.js';
import { toStoreResponse as getStoreResponse } from '@/domains/store/store.mapper.js';

// ============================================
// 응답 객체 베이스들
// ============================================
const toCartBaseResponse = (cart: CartBase<Date>): CartBase<string> => ({
  id: cart.id,
  buyerId: cart.buyerId,
  quantity: cart.quantity,
  createdAt: cart.createdAt.toISOString(),
  updatedAt: cart.updatedAt.toISOString(),
});

const toCartItemBaseResponse = (item: CartItemBase<Date>): CartItemBase<string> => ({
  id: item.id,
  cartId: item.cartId,
  productId: item.productId,
  sizeId: item.sizeId,
  quantity: item.quantity,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

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
  createdAt: productRawData.createdAt.toISOString(),
  updatedAt: productRawData.updatedAt.toISOString(),
  store: toStoreResponse(productRawData.store),
  stocks: productRawData.stocks.map(toStockResponse),
});

const toItemResponse = (itemRawData: GetCartItemRawData): GetCartItemResponse => ({
  ...toCartItemBaseResponse(itemRawData),
  product: toProductResponse(itemRawData.product),
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
// ============================================
// 장바구니 수정 응답 객체 변환
// ============================================
export const toUpdateCartResponse = (rawItems: UpdateCartRawData[]): UpdateCartResponse[] => {
  return rawItems.map(toCartItemBaseResponse);
};
// ============================================
// 아이템 상세 조회 응답 객체 변환
// ============================================
export const toGetCartItemResponse = (
  rawItem: GetCartItemDetailRawData,
): GetCartItemDetailResponse => ({
  ...toItemResponse(rawItem), // 명시적으로 필드를 1대1 매치하기때문에 cart가 같이 들어가도 안전
  cart: toCartBaseResponse(rawItem.cart),
});
