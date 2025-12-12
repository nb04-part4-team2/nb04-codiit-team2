import {
  GetCartItemDetailRawData,
  GetCartRawData,
  GetCartResponse,
} from '../../src/domains/cart/cart.dto';
import {
  SizeRawData,
  StockRawData,
  ProductRawData,
  GetCartItemRawData,
  CartBase,
  CartItemBase,
} from '../../src/domains/cart/cart.type';
import { createStoreMock } from './store.mock';
import { toGetCartResponse } from '../../src/domains/cart/cart.mapper';

// ============================================
// 객체 조립용 부품들
// ============================================
const date1 = new Date('2025-12-04T05:05:00.861Z');
const date2 = new Date('2025-12-04T05:05:00.861Z');

/**
 * [부품] 베이스 cart mock
 */
export const baseCartMock = {
  id: 'cart-id-1',
  buyerId: 'buyer-id-1',
  createdAt: date1,
  updatedAt: date2,
};

/**
 * [부품] 베이스 cart item mock
 */
export const baseCartItemMock = {
  id: 'item-id-1',
  cartId: 'cart-id-1',
  productId: 'product-id-1',
  sizeId: 1,
  quantity: 1,
  createdAt: date1,
  updatedAt: date2,
};

/**
 * [부품] Size 팩토리 (RawData니까 Flat 구조)
 */
export const createSizeMock = (overrides: Partial<SizeRawData> = {}): SizeRawData => ({
  id: 1,
  en: 'M',
  ko: '미디엄',
  ...overrides,
});

/**
 * [부품] Stock 팩토리
 */
export const createStockMock = (overrides: Partial<StockRawData> = {}): StockRawData => {
  const { size, ...rest } = overrides;
  return {
    id: 'stock-id-1',
    productId: 'product-id-1',
    sizeId: 1,
    quantity: 10,
    size: createSizeMock(size),
    ...rest,
  };
};

/**
 * [부품] Product 팩토리
 */
export const createProductMock = (overrides: Partial<ProductRawData> = {}): ProductRawData => {
  const { store, stocks, ...rest } = overrides;
  return {
    id: 'product-id-1',
    storeId: 'store-id-1',
    name: '테스트 상품',
    price: 10000,
    image: 'https://test.s3.ap-northeast-2.amazonaws.com/test/testImg1.jpg',
    discountRate: 0,
    discountStartTime: null,
    discountEndTime: null,
    reviewsRating: 1,
    categoryId: 'category-id-1',
    createdAt: date1,
    updatedAt: date2,
    store: createStoreMock(store),
    stocks: stocks ?? [],
    ...rest,
  };
};

/**
 * [부품] CartItem 팩토리
 */
export const createGetCartItemMock = (
  overrides: Partial<GetCartItemRawData> = {},
): GetCartItemRawData => {
  const { product, ...rest } = overrides;
  return {
    ...baseCartItemMock,
    product: createProductMock(product),
    ...rest,
  };
};

// ============================================
// RawData 객체 조립
// ============================================
/**
 * [완성본] BaseCartRawData 팩토리
 */
export const createCartBaseMock = (overrides: Partial<CartBase<Date>> = {}): CartBase<Date> => ({
  ...baseCartMock,
  ...overrides,
});
/**
 * [완성본] GetCartRawData 팩토리
 */
export const createCartMock = (overrides: Partial<GetCartRawData> = {}): GetCartRawData => {
  const { items, ...baseOverrides } = overrides;
  return {
    ...createCartBaseMock(baseOverrides),
    items: items ?? [createGetCartItemMock()],
  };
};
/**
 * [완성본] UpdateCartRawData 팩토리
 */
export const createCartItemMock = (
  overrides: Partial<CartItemBase<Date>> = {},
): CartItemBase<Date> => ({
  ...baseCartItemMock,
  ...overrides,
});
/**
 * [완성본] GetCartItemRawData 팩토리
 */
export const createCartItemDetailMock = (
  overrides: Partial<GetCartItemDetailRawData> = {},
): GetCartItemDetailRawData => {
  const { cart, ...baseOverrides } = overrides;
  return {
    ...createGetCartItemMock(baseOverrides),
    cart: createCartBaseMock(cart),
  };
};

// ============================================
// Response 객체 조립
// ============================================
/**
 * [완성본] GetCartResponseData 팩토리
 */
// mapper 활용해 RawData -> Response 변환
// 통합테스트때 활용
export const createCartResponseMock = (
  overrides: Partial<GetCartRawData> = {},
): GetCartResponse => {
  const rawData = createCartMock(overrides);
  return toGetCartResponse(rawData);
};
