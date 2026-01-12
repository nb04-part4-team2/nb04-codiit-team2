import {
  CartBase,
  CartItemBase,
  SizeRawData,
  SizeResponse,
  StoreBase,
} from '@/domains/cart/cart.type.js';
import { CreateOrderItemBody } from '@/domains/order/order.schema.js';
import { PaymentStatus, PointHistoryType, PrismaClient } from '@prisma/client';
import {
  CreateOrderItemRepoInput,
  CreateOrderRawData,
  CreateOrderRepoInput,
  CreateOrderServiceInput,
  CreatePointHistoryRepoInput,
  DecreaseStockRawData,
  GetOrderFromPaymentRawData,
  GetOrderRawData,
  GetOrderStatusRawData,
  GetPaymentPriceRawData,
  GetPaymentStatusRawData,
  ProductInfoRawData,
  UpdatePointRepoInput,
  UpdateStockRepoInput,
  UserInfoRawData,
} from '@/domains/order/order.dto.js';
import { DeepMockProxy } from 'jest-mock-extended';
import { OrderRepository } from '@/domains/order/order.repository.js';
import { CreateNotificationBody } from '@/domains/notification/notification.type.js';
import { UserService } from '@/domains/user/user.service.js';
import { SseManager } from '@/common/utils/sse.manager.js';
import { NotificationService } from '@/domains/notification/notification.service.js';

// ============================================
// 타입 베이스
// ============================================
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
// 재고 베이스
export interface StockBase {
  sizeId: number;
  quantity: number;
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
// 등급 베이스
export interface GradeBase {
  rate: number;
}

// ============================================
// db 조회 결과 RawData
// ============================================
// 포인트 히스토리 repo output
export interface GetPointHistoryRepoOutput extends PointHistoryBase {
  id: string;
  amount: number;
  userId: string;
  createdAt: Date;
}
// 주문 상세 조회 연관 조회용
// 부품 1. 상품 RawData
export type ProductRawData = ProductBase;
// 부품 2. 리뷰 RawData
export type ReviewRawData = ReviewBase<Date>;
// 부품 3. 결제정보 RawData
export type PaymentRawData = PaymentBase<Date>;

// 부품 4. 재고 RawData
export interface StockRawData extends StockBase {
  id: string;
  reservedQuantity: number;
  productId: string;
}

// 부품 5. 주문 아이템 RawData type
export interface GetOrderItemRawData extends GetOrderItemBase<ProductRawData, SizeRawData> {
  review: ReviewRawData | null;
}
// 재고 관련 데이터 Repo output용 부품들
// 부품 1. 재고 연관 조회 product
export interface StockProductRawData extends Pick<ProductBase, 'name'> {
  store: StockStoreRawData;
  cartItems: StockCartItemRawData[];
}
// 부품 2. 재고 연관 조회 store
export type StockStoreRawData = Pick<StoreBase<Date>, 'userId'>;
// 부품 3. 재고 연관 조회 장바구니 아이템
export interface StockCartItemRawData extends Pick<CartItemBase<Date>, 'sizeId'> {
  cart: StockCartRawData;
}
// 부품 4. 재고 연관 조회 장바구니
export type StockCartRawData = Pick<CartBase<Date>, 'buyerId'>;
// 부품 5. 재고 연관 조회 사이즈
export type StockSizeRawData = SizeRawData;

// 결제 테이블을 통해 주문 데이터 조회 output 타입
export interface OrderFromPayment {
  id: string;
  usePoint: number;
  buyerId: string;
  orderItems: GetOrderItemRawData[];
}

// 만료된 주문 아이템 repo output 타입
export interface ExpiredOrderItem extends StockBase {
  productId: string;
}

// ============================================
// 응답 객체용 Response
// ============================================
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

// ============================================
// 기타 유틸 타입
// ============================================
// 주문 아이템 repo input 생성용 객체 타입
export interface CreateOrderItemInputWithPrice extends CreateOrderItemBody {
  price: number;
}

// ============================================
// 테스트 관련 타입
// ============================================
// 성공 시나리오 아이템 추가 옵션
export interface ScenarioItemOption extends CreateOrderItemBody {
  stockQuantity?: number;
  itemPrice?: number;
  discountRate?: number;
  discountStartTime?: Date | null;
  discountEndTime?: Date | null;
}
// 주문 생성 시나리오 기본 옵션
export interface CreateOrderScenarioOptions {
  userId?: string;
  usePoint?: number;
  userPoint?: number;
  stockQuantity?: number; // 재고 수량 (0이면 품절 테스트)
  itemsPrice?: number;
  itemsQuantity?: number;
  orderItems?: ScenarioItemOption[];
}
// 주문 트랜잭션 처리 옵션
export interface OrderTxScenarioOptions {
  userPoint?: number;
  stockQuantity?: number;
  paymentStatus?: GetPaymentStatusRawData;
  orderStatus?: GetOrderStatusRawData;
  order?: OrderFromPayment;
}
// 주문 삭제 시나리오 기본 옵션
export interface DeleteOrderScenarioOptions {
  userId?: string;
  orderId?: string;
  usePoint?: number;
  orderItems?: CreateOrderItemBody[];
  payments?: PaymentRawData[];
  orderStatus?: GetOrderStatusRawData;
}
// 성공 시나리오 mock Repo output
interface CreateOnlyOrderMockRepo {
  userInfoOutput: UserInfoRawData;
  productsInfoOutput: ProductInfoRawData[];
  orderRepoOutput: CreateOrderRawData;
  getOrderOutput: GetOrderRawData;
}
interface OrderTxMockRepo {
  orderFromPaymentOutput: GetOrderFromPaymentRawData;
  userInfoOutput: UserInfoRawData;
  paymentStatus: GetPaymentStatusRawData;
  orderStatus: GetOrderStatusRawData;
  updatedStockOutput: DecreaseStockRawData[];
  paymentPrice: GetPaymentPriceRawData;
  getOrderOutput: GetOrderRawData;
}
// 주문 삭제 시나리오 mock Repo output
interface DeleteOrderMockRepo {
  getOrderOutput: GetOrderRawData;
  orderStatus: GetOrderStatusRawData;
  userInfoOutput: UserInfoRawData;
}
// 성공 시나리오 검증용 객체들
interface CreateOnlyOrderVerify {
  finalPrice: number;
  productIds: string[];
  orderRepoInput: CreateOrderRepoInput;
  orderItemsRepoInput: CreateOrderItemRepoInput[];
}
interface OrderTxVerify {
  decreasePointRepoInput?: UpdatePointRepoInput;
  decreasePointHistoryRepoInput?: CreatePointHistoryRepoInput;
  decreaseStockRepoInput: UpdateStockRepoInput[];
  notificationSellerInput: CreateNotificationBody[];
  notificationBuyerInput: CreateNotificationBody[][];
  increasePointRepoInput: UpdatePointRepoInput;
  increasePointHistoryRepoInput: CreatePointHistoryRepoInput;
  completedOrderNotificationInput: CreateNotificationBody;
}
// 주문 삭제 시나리오 검증용 객체들
interface DeleteOrderVerify {
  userId: string;
  orderId: string;
  targetPaymentId: string;
  restoreStockDatas: UpdateStockRepoInput[];
  pointHistoryRepoInput: Omit<CreatePointHistoryRepoInput, 'amount'>;
}

// 성공 시나리오 object mother 반환 타입
export interface CreateScenarioResult {
  input: CreateOrderServiceInput;
  mocks: CreateOnlyOrderMockRepo;
  verify: CreateOnlyOrderVerify;
}
export interface OrderTxResult {
  mocks: OrderTxMockRepo;
  verify: OrderTxVerify;
}

// 주문 삭제 시나리오 object mother 반환 타입
export interface DeleteScenarioResult {
  mocks: DeleteOrderMockRepo;
  verify: DeleteOrderVerify;
}

// 성공 시나리오 기본 repo output 세팅
export interface SetupCreateOnlyOrderMockReposInput {
  mockOrderRepo: DeepMockProxy<OrderRepository>;
  mockData: CreateOnlyOrderMockRepo;
}
export interface SetupOrderTxMockReposInput {
  mockOrderRepo: DeepMockProxy<OrderRepository>;
  mockData: OrderTxMockRepo;
}

// 주문 삭제 시나리오 기본 repo output 세팅
export interface SetupDeleteOrderMockReposInput {
  mockOrderRepo: DeepMockProxy<OrderRepository>;
  mockData: DeleteOrderMockRepo;
}

// 성공 시나리오 검증 베이스 input
export interface ExpectBaseInput {
  mockPrisma: DeepMockProxy<PrismaClient>;
  scenario: CreateScenarioResult;
}

// 주문 트랜잭션 검증 베이스 input
export interface ExpectTxBaseInput {
  mockPrisma: DeepMockProxy<PrismaClient>;
  scenario: OrderTxResult;
}

// 주문 삭제 시나리오 검증 베이스 input
export interface ExpectDeleteBaseInput {
  mockPrisma: DeepMockProxy<PrismaClient>;
  mockOrderRepo: DeepMockProxy<OrderRepository>;
  mockUserService: DeepMockProxy<UserService>;
  mocks: DeleteOrderMockRepo;
  verify: DeleteOrderVerify;
}

// 성공 시나리오 기본 공통 검증 세팅
export interface ExpectOnlyOrderCreateInput extends ExpectBaseInput {
  result: GetOrderRawData;
  mockOrderRepo: DeepMockProxy<OrderRepository>;
}

export interface ExpectOrderTxInput extends ExpectTxBaseInput {
  result: GetOrderRawData | undefined;
  mockOrderRepo: DeepMockProxy<OrderRepository>;
  mockNotificationService: DeepMockProxy<NotificationService>;
  mockUserService: DeepMockProxy<UserService>;
  mockSseManager: DeepMockProxy<SseManager>;
  paymentId: string;
}

// 주문 트랜잭션 주문 정보 조회 검증
export interface ExpectOrderInput {
  mockOrderRepo: DeepMockProxy<OrderRepository>;
  paymentId: string;
}

// 주문 트랜잭션 유저 정보 조회 검증
export interface ExpectUserInfo {
  mockOrderRepo: DeepMockProxy<OrderRepository>;
  buyerId: string;
}

// 성공 시나리오 포인트 검증
export interface ExpectPointInput extends ExpectTxBaseInput {
  mockOrderRepo: DeepMockProxy<OrderRepository>;
}

// 주문 트랜잭션 주문 상태 업데이트 검증
export type ExpectUpdateStatusInput = ExpectPointInput;

// 성공 시나리오 재고 검증
export type ExpectStockInput = ExpectPointInput;

// 성공 시나리오 알림 검증
export interface ExpectNotificationInput extends ExpectTxBaseInput {
  mockNotificationService: DeepMockProxy<NotificationService>;
}

// 성공 시나리오 알림 발송 검증
export interface ExpectSendNotificationInput {
  mockSseManager: DeepMockProxy<SseManager>;
  scenario: OrderTxResult;
}

// 성공 시나리오 유저 등급 업데이트 검증
export interface ExpectUserGradeInput {
  mockUserService: DeepMockProxy<UserService>;
}

// 주문 트랜잭션 결제 상태 조회 expect
export interface ExpectPaymentStatus {
  mockPrisma: DeepMockProxy<PrismaClient>;
  mockOrderRepo: DeepMockProxy<OrderRepository>;
  paymentId: string;
}

// 주문 트랜잭션 결제 상태 업데이트 expect
export type ExpectUpdatePaymentStatus = ExpectPaymentStatus;

// 주문 트랜잭션 주문 상태 조회 expect
export interface ExpectOrderStatus {
  mockPrisma: DeepMockProxy<PrismaClient>;
  mockOrderRepo: DeepMockProxy<OrderRepository>;
  orderId: string;
}

// 주문 트랜잭션 최종 결과 조회 expect
export interface ExpectResult {
  mockOrderRepo: DeepMockProxy<OrderRepository>;
  scenario: OrderTxResult;
  result: GetOrderRawData | undefined; // 주문 트랜잭션에서는 중복 방지를 위해 중간에 종료될 수 있음
}
