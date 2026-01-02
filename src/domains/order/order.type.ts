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
  CreatePaymentRepoInput,
  CreatePointHistoryRepoInput,
  DecreaseStockRawData,
  GetOrderRawData,
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
// 주문 상세 조회 연관 조회용
// 부품 1. 상품 RawData
export type ProductRawData = ProductBase;
// 부품 2. 리뷰 RawData
export type ReviewRawData = ReviewBase<Date>;
// 부품 3. 결제정보 RawData
export type PaymentRawData = PaymentBase<Date>;
// 부품 4. 주문 아이템 RawData type
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
// 성공 시나리오 기본 옵션
export interface OrderScenarioOptions {
  userId?: string;
  usePoint?: number;
  userPoint?: number;
  stockQuantity?: number; // 재고 수량 (0이면 품절 테스트)
  itemsPrice?: number;
  itemsQuantity?: number;
  orderItems?: ScenarioItemOption[];
}
// 성공 시나리오 mock Repo output
interface MockRepo {
  userInfoOutput: UserInfoRawData;
  productsInfoOutput: ProductInfoRawData[];
  orderRepoOutput: CreateOrderRawData;
  updatedStockOutput: DecreaseStockRawData[];
  getOrderOutput: GetOrderRawData;
}
// 성공 시나리오 검증용 객체들
interface Verify {
  productIds: string[];
  finalPrice: number;
  orderRepoInput: CreateOrderRepoInput;
  orderItemsRepoInput: CreateOrderItemRepoInput[];
  decreasePointRepoInput?: UpdatePointRepoInput;
  decreasePointHistoryRepoInput?: CreatePointHistoryRepoInput;
  paymentRepoInput: CreatePaymentRepoInput;
  decreaseStockRepoInput: UpdateStockRepoInput[];
  notificationSellerInput: CreateNotificationBody[];
  notificationBuyerInput: CreateNotificationBody[][];
  increasePointRepoInput: UpdatePointRepoInput;
  increasePointHistoryRepoInput: CreatePointHistoryRepoInput;
}

// 성공 시나리오 object mother 반환 타입
export interface ScenarioReturn {
  input: CreateOrderServiceInput;
  mocks: MockRepo;
  verify: Verify;
}

// 성공 시나리오 기본 repo output 세팅
export interface SetupMockReposInput {
  mockOrderRepo: DeepMockProxy<OrderRepository>;
  mockData: MockRepo;
}

// 성공 시나리오 검증 베이스 input
export interface ExpectBaseInput {
  mockPrisma: DeepMockProxy<PrismaClient>;
  scenario: ScenarioReturn;
}

// 성공 시나리오 기본 공통 검증 세팅
export interface ExpectOrderCreateInput extends ExpectBaseInput {
  result: GetOrderRawData;
  mockOrderRepo: DeepMockProxy<OrderRepository>;
}

// 성공 시나리오 포인트 검증
export interface ExpectPointInput extends ExpectBaseInput {
  mockOrderRepo: DeepMockProxy<OrderRepository>;
}

// 성공 시나리오 재고 검증
export type ExpectStockInput = ExpectPointInput;

// 성공 시나리오 알림 검증
export interface ExpectNotificationInput extends ExpectBaseInput {
  mockNotificationService: DeepMockProxy<NotificationService>;
}

// 성공 시나리오 알림 발송 검증
export interface ExpectSendNotificationInput {
  mockSseManager: DeepMockProxy<SseManager>;
  scenario: ScenarioReturn;
}

// 성공 시나리오 유저 등급 업데이트 검증
export interface ExpectUserGradeInput {
  mockUserService: DeepMockProxy<UserService>;
}
