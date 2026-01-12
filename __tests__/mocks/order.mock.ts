import {
  GetOrderItemRawData,
  GetPointHistoryRepoOutput,
  GradeBase,
  OrderBase,
  OrderFromPayment,
  PaymentRawData,
  ProductRawData,
  ReviewRawData,
  ScenarioItemOption,
  StockBase,
  StockCartItemRawData,
  StockCartRawData,
  StockProductRawData,
  StockSizeRawData,
  StockStoreRawData,
} from '@/domains/order/order.type.js';
import {
  CreateOrderItemRepoInput,
  CreateOrderRawData,
  CreateOrderRepoInput,
  CreateOrderServiceInput,
  CreatePaymentRepoInput,
  CreatePointHistoryRepoInput,
  DecreaseStockRawData,
  ExpiredOrderRawData,
  GetOrderFromPaymentRawData,
  GetOrderRawData,
  GetOrdersServiceInput,
  ProductInfoRawData,
  UpdateOrderServiceInput,
  UpdatePointRepoInput,
  UpdateStockRepoInput,
  UserInfoRawData,
} from '@/domains/order/order.dto.js';
import { CreateOrderItemBody } from '@/domains/order/order.schema.js';
import { createSizeMock } from './cart.mock.js';
import { OrderStatus, PaymentStatus, PointHistoryType } from '@prisma/client';
import { CreateNotificationBody } from '@/domains/notification/notification.type.js';

// ============================================
// 객체 조립용 부품들
// ============================================
const date1 = new Date('2025-12-04T05:05:00.861Z');
const date2 = new Date('2025-12-05T05:05:00.861Z');
/**
 * [부품] 베이스 order mock
 */
export const baseOrderMock = {
  id: 'order-id-1',
  name: '테스트 주문',
  phoneNumber: '010-1234-1234',
  address: '서울특별시',
  subtotal: 10000,
  totalQuantity: 1,
  usePoint: 0,
  createdAt: date1,
};
/**
 * [부품] 베이스 order Input mock
 */
export const baseOrderInputMock = {
  name: '테스트 주문',
  phone: '010-1234-1234',
  address: '서울특별시',
  usePoint: 0,
};
/**
 * [부품] 베이스 orderItem mock
 */
export const baseOrderItemMock = {
  id: 'order-item-id-1',
  price: 10000,
  quantity: 1,
  productId: 'product-id-1',
};
/**
 * [부품] 베이스 orderItem Input mock
 */
export const baseOrderItemInputMock = {
  productId: 'product-id-1',
  sizeId: 1,
  quantity: 1,
};
/**
 * [부품] 베이스 stockOutput mock
 */
export const baseStockOutputMock = {
  sizeId: 1,
  quantity: 1,
};
/**
 * [부품] 베이스 stockInput mock
 */
export const baseStockInputMock = {
  ...baseStockOutputMock,
  productId: 'product-id-1',
};
/**
 * [부품] 베이스 stock mock
 */
export const baseStockMock = {
  ...baseStockInputMock,
  id: 'stock-id-1',
};
/**
 * [부품] 베이스 review mock
 */
export const baseReviewMock = {
  id: 'review-id-1',
  rating: 5,
  content: 'review-content-1',
  createdAt: date1,
};
/**
 * [부품] 베이스 PaymentInput mock
 */
export const basePaymentInputMock = {
  orderId: 'order-id-1',
  price: 10000,
  status: PaymentStatus.pending,
};
/**
 * [부품] 베이스 Payment mock
 */
export const basePaymentMock = {
  id: 'payment-id-1',
  createdAt: date1,
  updatedAt: date2,
  ...basePaymentInputMock,
};
/**
 * [부품] 베이스 Point History mock
 */
export const basePointHistory = {
  id: 'point-history-1',
  type: PointHistoryType.EARN,
  amount: 1000,
  createdAt: date1,
};
// ============================================
// 부품 팩토리 (output 객체용 부품들)
// ============================================
// 1. 유저 정보 조회 연관 등급 조회 결과 팩토리
/**
 * [부품] 베이스 grade mock
 */
export const createGradeMock = (overrides: Partial<GradeBase> = {}): GradeBase => ({
  rate: 0.01,
  ...overrides,
});
// 2. 상품 정보 조회 결과 팩토리
/**
 * [부품] 베이스 productInfo mock
 */
export const createProductInfoMock = (
  overrides: Partial<ProductInfoRawData> = {},
): ProductInfoRawData => {
  const { stocks, ...rest } = overrides;
  return {
    id: 'product-id-1',
    name: 'product-1',
    price: 10000,
    discountRate: 0,
    discountStartTime: null,
    discountEndTime: null,
    stocks: stocks ? stocks.map(createStockOutputMock) : [],
    ...rest,
  };
};
// 2-1. 상품 정보 조회에서 재고 연관 조회 결과 팩토리
/**
 * [부품] 베이스 productInfo stock mock
 */
export const createStockOutputMock = (overrides: Partial<StockBase> = {}): StockBase => ({
  ...baseStockOutputMock,
  ...overrides,
});
// 3. 주문 상세 조회에서 주문 아이템 조회 결과 팩토리
/**
 * [부품] 베이스 orderItem RawData 팩토리
 */
export const createOrderItemMock = (
  overrides: Partial<GetOrderItemRawData> = {},
): GetOrderItemRawData => {
  const { review, product, size, ...rest } = overrides;
  return {
    ...baseOrderItemMock,
    review: review ? createReviewMock(review) : null,
    product: createProductMock(product),
    size: createSizeMock(size),
    ...rest,
  };
};
// 3-1. 주문 아이템 조회에서 리뷰 연관 조회 결과 팩토리
/**
 * [부품] 베이스 review RawData 팩토리
 */
export const createReviewMock = (override: Partial<ReviewRawData> = {}): ReviewRawData => ({
  ...baseReviewMock,
  ...override,
});
// 3-2. 주문 아이템 조회에서 상품 연관 조회 결과 팩토리
/**
 * [부품] 베이스 product RawData 팩토리
 */
export const createProductMock = (override: Partial<ProductRawData> = {}): ProductRawData => ({
  name: 'product-1',
  image: 'test.jpg',
  ...override,
});
// 4. 주문 상세 조회에서 결제 정보 연관 조회 결과 팩토리
/**
 * [부품] 베이스 payment RawData 팩토리
 */
export const createPaymentMock = (override: Partial<PaymentRawData> = {}): PaymentRawData => ({
  ...basePaymentMock,
  ...override,
});
// 5. 재고 조회에서 상품 연관 조회 팩토리
/**
 * [부품] [재고 조회 연관] 베이스 product mock
 */
export const createStockProductMock = (
  overrides: Partial<StockProductRawData> = {},
): StockProductRawData => {
  const { store, cartItems, ...rest } = overrides;
  return {
    name: 'product-1',
    store: createStockStoreMock(store),
    cartItems: cartItems ? cartItems.map(createStockCartItemMock) : [createStockCartItemMock()],
    ...rest,
  };
};
// 5-1. 상품 연관 조회에서 스토어 연관 조회 결과 팩토리
/**
 * [부품] [재고 조회 연관] 베이스 store mock
 */
export const createStockStoreMock = (
  overrides: Partial<StockStoreRawData> = {},
): StockStoreRawData => ({
  userId: 'seller-id-1',
  ...overrides,
});
// 6. 상품 연관 조회에서 장바구니 상품 조회 결과 팩토리
/**
 * [부품] [재고 조회 연관] 베이스 CartItem mock
 */
export const createStockCartItemMock = (
  overrides: Partial<StockCartItemRawData> = {},
): StockCartItemRawData => {
  const { cart, ...rest } = overrides;
  return {
    sizeId: 1,
    cart: createStockCartMock(cart),
    ...rest,
  };
};
// 6-1. 장바구니 상품 연관 조회에서 장바구니 연관 조회 결과 팩토리
/**
 * [부품] [재고 조회 연관] 베이스 Cart mock
 */
export const createStockCartMock = (
  overrides: Partial<StockCartRawData> = {},
): StockCartRawData => ({
  buyerId: 'buyer-id-1',
  ...overrides,
});
// 7. 재고 연관 조회에서 사이즈 연관 조회 결과 팩토리
/**
 * [부품] [재고 조회 연관] 베이스 size mock
 */
export const createStockSizeMock = (
  overrides: Partial<StockSizeRawData> = {},
): StockSizeRawData => ({
  id: 1,
  ko: '미디엄',
  en: 'M',
  ...overrides,
});
// 8. 결제 테이블을 통한 주문 조회 결과 팩토리
/**
 * [부품] 결제 테이블을 통한 주문 조회 베이스 mock
 */
export const createOrderFromPaymentMock = (
  overrides: Partial<OrderFromPayment> = {},
): OrderFromPayment => {
  const { orderItems, ...rest } = overrides;
  return {
    id: 'order-id-1',
    usePoint: 0,
    buyerId: 'buyer-id-1',
    orderItems: orderItems ? orderItems.map(createOrderItemMock) : [],
    ...rest,
  };
};

// ============================================
// 부품 팩토리 (input 객체용 부품들)
// ============================================
// 1. 주문 생성 service input용 주문 아이템 팩토리
/**
 * [부품] 베이스 orderItem Input 팩토리
 */
export const createOrderItemInputMock = (
  overrides: Partial<CreateOrderItemBody> = {},
): CreateOrderItemBody => ({
  ...baseOrderItemInputMock,
  ...overrides,
});
// 2. 주문 목록 조회 input용 팩토리
/**
 * [부품] 베이스 GetOrders Input mock
 */
export const baseGetOrdersInputMock = {
  userId: 'buyer-id-1',
  status: OrderStatus.CompletedPayment,
  limit: 10,
  page: 1,
};
// ============================================
// RawData 객체 조립
// ============================================
// 0. 주문 객체 베이스
/**
 * [완성본] BaseOrderRawData 팩토리
 */
export const createOrderBaseMock = (overrides: Partial<OrderBase<Date>> = {}): OrderBase<Date> => ({
  ...baseOrderMock,
  ...overrides,
});
// 1. 유저 정보 조회 repo output
/**
 * [완성본] GetUserInfoRawData 팩토리
 */
export const createGetUserInfoMock = (
  overrides: Partial<UserInfoRawData> = {},
): UserInfoRawData => {
  const { grade, ...rest } = overrides;
  return {
    point: 1000,
    grade: createGradeMock(grade),
    ...rest,
  };
};
// 2. 상품 정보 조회 repo output
/**
 * [완성본] GetProductsInfoRawData 팩토리
 */
export const createGetProductsInfoMock = (
  overrides: Partial<ProductInfoRawData>[] = [],
): ProductInfoRawData[] => {
  if (overrides.length === 0) {
    return [createProductInfoMock()];
  }
  return overrides.map(createProductInfoMock);
};
// 3. 주문 생성 repo output
/**
 * [완성본] CreateOrderRawData 팩토리
 */
export const createOrderMock = (
  overrides: Partial<CreateOrderRawData> = {},
): CreateOrderRawData => {
  const { buyerId, ...baseOverrides } = overrides;
  return {
    ...createOrderBaseMock(baseOverrides),
    buyerId: buyerId ?? 'buyer-id-1',
  };
};
// 4. 주문 상세 조회 repo output
/**
 * [완성본] GetOrderRawData 팩토리
 */
export const createGetOrderMock = (overrides: Partial<GetOrderRawData> = {}): GetOrderRawData => {
  const { orderItems, payments, ...rest } = overrides;
  return {
    ...createOrderBaseMock(),
    buyerId: 'buyer-id-1',
    orderItems: orderItems ? orderItems.map(createOrderItemMock) : [],
    payments: payments ? payments.map(createPaymentMock) : [],
    ...rest,
  };
};
// 5. 재고 감소 repo output
/**
 * [완성본] decreaseStockRawData 팩토리
 */
export const createStockDataMock = (
  overrides: Partial<DecreaseStockRawData> = {},
): DecreaseStockRawData => {
  const { product, size, ...rest } = overrides;
  return {
    ...baseStockMock,
    product: createStockProductMock(product),
    size: createStockSizeMock(size),
    ...rest,
  };
};
// 6. 포인트 히스토리 조회 repo output
/**
 * [완성본] findPointHistoryRawData 팩토리
 */
export const createGetPointHistoryMock = (
  overrides: Partial<GetPointHistoryRepoOutput> = {},
): GetPointHistoryRepoOutput => ({
  ...basePointHistory,
  userId: 'buyer-id-1',
  orderId: 'order-id-1',
  ...overrides,
});
// 7. 결제, 주문 정보 조회 repo output
/**
 * [완성본] findPaymentWithOrderRawData 팩토리
 */
export const createGetOrderFromPaymentMock = (
  overrides: Partial<GetOrderFromPaymentRawData> = {},
): GetOrderFromPaymentRawData => ({
  order: createOrderFromPaymentMock(overrides.order),
});
// 8. 만료된 주문 조회 repo output
/**
 * [완성본] ExpiredOrderRawData 팩토리
 */
export const createExpiredOrderRawDataMock = (
  overrides: Partial<ExpiredOrderRawData> = {},
): ExpiredOrderRawData => {
  return {
    id: 'order-id-1',
    orderItems: [baseOrderItemInputMock],
    ...overrides,
  };
};

// ============================================
// INPUT 객체 조립
// ============================================
// 1. 주문 생성 service input
/**
 * [완성본] CreateOrderServiceInput 팩토리
 */
export const createOrderServiceInputMock = (
  overrides: Partial<CreateOrderServiceInput> = {},
): CreateOrderServiceInput => {
  const { orderItems, ...baseInputOverrides } = overrides;
  return {
    userId: overrides.userId ?? 'buyer-id-1',
    orderItems: orderItems ? orderItems.map(createOrderItemInputMock) : [],
    ...baseOrderInputMock,
    ...baseInputOverrides,
  };
};
// 2. 주문 생성 repo input
/**
 * [완성본] CreateOrderRepoInput 팩토리
 */
export const createOrderRepoInputMock = (
  overrides: Partial<CreateOrderRepoInput> = {},
): CreateOrderRepoInput => {
  const { subtotal, totalQuantity, expiresAt, ...rest } = overrides;
  const { orderItems: _orderItems, ...restOrderData } = createOrderServiceInputMock(rest);
  return {
    ...restOrderData,
    subtotal: subtotal ?? 10000,
    totalQuantity: totalQuantity ?? 1,
    expiresAt: expiresAt ?? null,
  };
};
// 3. 주문 아이템 생성 repo input
/**
 * [완성본] CreateOrderItemsRepoInput 팩토리
 */
export const createOrderItemsRepoInputMock = (
  overrides: Partial<CreateOrderItemRepoInput>[] = [],
): CreateOrderItemRepoInput[] => {
  if (overrides.length === 0) {
    return [
      {
        ...createOrderItemInputMock(),
        orderId: 'order-id-1',
        price: 10000,
      },
    ];
  }
  return overrides.map((item) => {
    const { orderId, price, ...baseOrderItem } = item;
    return {
      ...createOrderItemInputMock(baseOrderItem),
      orderId: orderId ?? 'order-id-1',
      price: price ?? 10000,
    };
  });
};
// 4. 포인트 차감 repo input
/**
 * [완성본] PointRepoInput 팩토리
 */
export const createPointInputMock = (
  overrides: Partial<UpdatePointRepoInput> = {},
): UpdatePointRepoInput => ({
  userId: 'buyer-id-1',
  amount: 1000,
  ...overrides,
});
// 5. 포인트 히스토리 repo input
/**
 * [완성본] PointHistoryRepoInput 팩토리
 */
export const createPointHistoryInputMock = (
  overrides: Partial<CreatePointHistoryRepoInput> = {},
): CreatePointHistoryRepoInput => {
  const { orderId, type, ...basePoint } = overrides;
  return {
    orderId: orderId ?? 'order-id-1',
    type: type ?? PointHistoryType.USE,
    ...createPointInputMock(basePoint),
  };
};
// 6. 결제 정보 생성 repo input
/**
 * [완성본] PaymentRepoInput 팩토리
 */
export const createPaymentInputMock = (
  overrides: Partial<CreatePaymentRepoInput> = {},
): CreatePaymentRepoInput => ({
  ...basePaymentInputMock,
  ...overrides,
});
// 7. 알림 생성 repo input
/**
 * [완성본] notificationInput 팩토리
 */
// 알림 생성 repo input
// 기본은 판매자용 / 배열화 하면 구매자용으로도 사용 가능
export const createNotificationInputMock = (
  overrides: Partial<CreateNotificationBody> = {},
): CreateNotificationBody => {
  const { product: stockProduct, size: stockSize } = createStockDataMock();
  return {
    userId: stockProduct.store.userId,
    content: `${stockProduct.name}의 ${stockSize.en} 사이즈가 품절되었습니다.`,
    ...overrides,
  };
};
// 8. 재고 업데이트 repo input
/**
 * [완성본] StockRepoInput 팩토리
 */
export const createStockInputMock = (
  overrides: Partial<UpdateStockRepoInput> = {},
): UpdateStockRepoInput => ({
  ...baseStockInputMock,
  ...overrides,
});
// 9. 주문 수정 service input
/**
 * [완성본] UpdateOrderServiceInput 팩토리
 */
export const updateOrderServiceInputMock = (
  overrides: Partial<UpdateOrderServiceInput> = {},
): UpdateOrderServiceInput => {
  const { usePoint: _usePoint, ...baseUpdateInput } = baseOrderInputMock;
  return {
    userId: overrides.userId ?? 'buyer-id-1',
    orderId: overrides.orderId ?? 'order-id-1',
    ...baseUpdateInput,
    ...overrides,
  };
};
// 10. 주문 목록 조회 service input
/**
 * [완성본] GetOrdersServiceInput 팩토리
 */
export const getOrdersServiceInputMock = (
  overrides: Partial<GetOrdersServiceInput> = {},
): GetOrdersServiceInput => ({
  ...baseGetOrdersInputMock,
  ...overrides,
});
// ============================================
// 시나리오용 헬퍼
// ============================================
/**
 * [Helper] 시나리오용 주문 아이템 옵션 생성 팩토리
 */
export const createScenarioItem = (
  overrides: Partial<ScenarioItemOption> = {},
): ScenarioItemOption => {
  const { stockQuantity, itemPrice, discountRate, discountStartTime, discountEndTime, ...rest } =
    overrides;
  return {
    ...createOrderItemInputMock(rest),
    stockQuantity,
    itemPrice,
    discountRate: discountRate ?? 0,
    discountStartTime: discountStartTime ?? null,
    discountEndTime: discountEndTime ?? null,
  };
};
