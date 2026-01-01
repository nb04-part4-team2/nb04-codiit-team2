import { beforeEach, describe, it, jest } from '@jest/globals';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Prisma, PrismaClient } from '@prisma/client';
import { OrderRepository } from '@/domains/order/order.repository.js';
import { OrderService } from '@/domains/order/order.service.js';
import { createScenarioItem } from '../mocks/order.mock.js';
import { NotificationService } from '@/domains/notification/notification.service.js';
import { TxMock } from '../helpers/test.type.js';
import { UserService } from '@/domains/user/user.service.js';
import {
  expectBaseOrderCreated,
  expectBuyerNotificationSend,
  expectCreateBuyerNotification,
  expectCreateSellerNotification,
  expectDecreaseStock,
  expectFinalPrice,
  expectPointEarn,
  expectPointHistory,
  expectPointUsed,
  expectSellerNotificationSend,
  expectUpdateUserGrade,
  setupCreateOrderScenario,
  setUpMockRepos,
} from '../mocks/order.helper.js';
import { SseManager } from '@/common/utils/sse.manager.js';

describe('OrderService', () => {
  let mockOrderRepo: DeepMockProxy<OrderRepository>;
  let mockPrisma: DeepMockProxy<PrismaClient>;
  let mockNotificationService: DeepMockProxy<NotificationService>;
  let mockUserService: DeepMockProxy<UserService>;
  let mockOrderService: OrderService;
  let mockSseManager: DeepMockProxy<SseManager>;

  beforeEach(() => {
    jest.resetAllMocks();

    mockOrderRepo = mockDeep<OrderRepository>();
    mockPrisma = mockDeep<PrismaClient>();
    mockNotificationService = mockDeep<NotificationService>();
    mockUserService = mockDeep<UserService>();
    mockSseManager = mockDeep<SseManager>();

    mockOrderService = new OrderService(
      mockOrderRepo,
      mockNotificationService,
      mockPrisma,
      mockUserService,
      mockSseManager,
    );
  });
  // 목 데이터들을 각 테스트 마다 너무 많이 만들어줘야하는 상황
  // object mother 패턴 적용 (학습 필요)
  describe('주문 생성', () => {
    it('주문 성공 (단일 상품, 포인트 사용 x, 알림 발송 x, 할인 x)', async () => {
      // given
      const scenario = setupCreateOrderScenario({
        orderItems: [
          createScenarioItem({
            stockQuantity: 10,
            itemPrice: 10000,
          }),
        ],
      });
      const { input, mocks } = scenario;
      // mockRepo
      (mockPrisma.$transaction as jest.MockedFunction<TxMock>).mockImplementation(async (cb) =>
        cb(mockPrisma as Prisma.TransactionClient),
      ); // 파일 분리하니 타입 추론이 에러 발생 -> 테스트 본문에서 직접 선언
      // 나머지 기본 mockRepo 세팅
      setUpMockRepos({ mockOrderRepo, mockData: mocks });

      // when
      const result = await mockOrderService.createOrder(input);

      // then
      // 기본 주문 완료 검증
      expectBaseOrderCreated({
        result,
        mockOrderRepo,
        mockPrisma,
        scenario,
      });
      // 포인트 적립 검증
      expectPointEarn({ mockOrderRepo, mockPrisma, scenario });
      // 포인트 히스토리 검증
      expectPointHistory({ mockOrderRepo, mockPrisma, scenario });
      // 재고 감소 검증
      expectDecreaseStock({ mockOrderRepo, mockPrisma, scenario });
      // 유저 등급 업데이트 검증
      expectUpdateUserGrade({ mockUserService });
      // 상품 최종 가격 검증
      expectFinalPrice(scenario, 10000);
    });
    it('주문 성공 (다중 상품, 포인트 사용 x, 알림 발송 x, 할인 x)', async () => {
      // given
      const scenario = setupCreateOrderScenario({
        orderItems: [
          createScenarioItem({
            stockQuantity: 10,
            itemPrice: 10000,
          }),
          createScenarioItem({
            productId: 'product-id-2',
            sizeId: 2,
            quantity: 2,
            stockQuantity: 10,
            itemPrice: 10000,
          }),
        ],
      });
      const { input, mocks } = scenario;
      // mockRepo
      (mockPrisma.$transaction as jest.MockedFunction<TxMock>).mockImplementation(async (cb) =>
        cb(mockPrisma as Prisma.TransactionClient),
      );
      // 나머지 기본 mockRepo 세팅
      setUpMockRepos({ mockOrderRepo, mockData: mocks });

      // when
      const result = await mockOrderService.createOrder(input);

      // then
      // 기본 주문 완료 검증
      expectBaseOrderCreated({
        result,
        mockOrderRepo,
        mockPrisma,
        scenario,
      });
      // 포인트 적립 검증
      expectPointEarn({ mockOrderRepo, mockPrisma, scenario });
      // 포인트 히스토리 검증
      expectPointHistory({ mockOrderRepo, mockPrisma, scenario });
      // 재고 감소 검증
      expectDecreaseStock({ mockOrderRepo, mockPrisma, scenario });
      // 유저 등급 업데이트 검증
      expectUpdateUserGrade({ mockUserService });
      // 상품 최종 가격 검증
      expectFinalPrice(scenario, 30000);
    });
    it('주문 성공 (다중 상품, 포인트 사용 O, 알림 발송 x, 할인 x)', async () => {
      // given
      const scenario = setupCreateOrderScenario({
        usePoint: 1000,
        orderItems: [
          createScenarioItem({
            stockQuantity: 10,
            itemPrice: 10000,
          }),
          createScenarioItem({
            productId: 'product-id-2',
            sizeId: 2,
            quantity: 2,
            stockQuantity: 10,
            itemPrice: 10000,
          }),
        ],
      });
      const { input, mocks } = scenario;
      // mockRepo
      (mockPrisma.$transaction as jest.MockedFunction<TxMock>).mockImplementation(async (cb) =>
        cb(mockPrisma as Prisma.TransactionClient),
      );
      setUpMockRepos({ mockOrderRepo, mockData: mocks });

      // when
      const result = await mockOrderService.createOrder(input);

      // then
      // 기본 주문 완료 검증
      expectBaseOrderCreated({
        result,
        mockOrderRepo,
        mockPrisma,
        scenario,
      });
      // 포인트 사용 검증
      expectPointUsed({ mockOrderRepo, mockPrisma, scenario });
      // 포인트 적립 검증
      expectPointEarn({ mockOrderRepo, mockPrisma, scenario });
      // 포인트 히스토리 검증
      expectPointHistory({ mockOrderRepo, mockPrisma, scenario });
      // 재고 감소 검증
      expectDecreaseStock({ mockOrderRepo, mockPrisma, scenario });
      // 유저 등급 업데이트 검증
      expectUpdateUserGrade({ mockUserService });
      // 상품 최종 가격 검증
      expectFinalPrice(scenario, 29000);
    });
    it('주문 성공 (다중 상품, 포인트 사용 O, 알림 발송 O, 할인 x)', async () => {
      // given
      const scenario = setupCreateOrderScenario({
        usePoint: 1000,
        orderItems: [
          createScenarioItem({
            stockQuantity: 1, // 1개 사면 품절되는 상황 발생 -> 알림 발송
            itemPrice: 10000,
          }),
          createScenarioItem({
            productId: 'product-id-2',
            sizeId: 2,
            quantity: 2,
            stockQuantity: 10,
            itemPrice: 10000,
          }),
        ],
      });
      const { input, mocks } = scenario;
      // mockRepo
      (mockPrisma.$transaction as jest.MockedFunction<TxMock>).mockImplementation(async (cb) =>
        cb(mockPrisma as Prisma.TransactionClient),
      );
      setUpMockRepos({ mockOrderRepo, mockData: mocks });

      // when
      const result = await mockOrderService.createOrder(input);

      // then
      // 시나리오 생성하는 시점에 비즈니스 로직 흐름에 맞게 데이터를 고정해둬서 검증 순서는 상관 없음
      // 기본 주문 완료 검증
      expectBaseOrderCreated({
        result,
        mockOrderRepo,
        mockPrisma,
        scenario,
      });
      // 포인트 사용 검증
      expectPointUsed({ mockOrderRepo, mockPrisma, scenario });
      // 포인트 적립 검증
      expectPointEarn({ mockOrderRepo, mockPrisma, scenario });
      // 포인트 히스토리 검증
      expectPointHistory({ mockOrderRepo, mockPrisma, scenario });
      // 재고 감소 검증
      expectDecreaseStock({ mockOrderRepo, mockPrisma, scenario });
      // 판매자 알림 생성 검증
      expectCreateSellerNotification({ mockNotificationService, mockPrisma, scenario });
      // 장바구니 유저 알림 생성 검증
      expectCreateBuyerNotification({ mockNotificationService, mockPrisma, scenario });
      // 판매자 알림 발송 검증
      expectSellerNotificationSend({ mockSseManager, scenario });
      // 장바구니 유저 알림 발송 검증
      expectBuyerNotificationSend({ mockSseManager, scenario });
      // 유저 등급 업데이트 검증
      expectUpdateUserGrade({ mockUserService });
      // 상품 최종 가격 검증
      expectFinalPrice(scenario, 29000);
    });
    it('주문 성공 (다중 상품, 포인트 사용 O, 알림 발송 O, 할인(기간 할인) O)', async () => {
      // given
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const scenario = setupCreateOrderScenario({
        usePoint: 1000,
        orderItems: [
          createScenarioItem({
            stockQuantity: 1, // 1개 사면 품절되는 상황 발생 -> 알림 발송
            itemPrice: 10000,
          }),
          createScenarioItem({
            productId: 'product-id-2',
            sizeId: 2,
            quantity: 2,
            stockQuantity: 10,
            itemPrice: 10000,
            discountRate: 10, // 10% 할인
            discountStartTime: yesterday,
            discountEndTime: tomorrow,
          }),
        ],
      });
      const { input, mocks } = scenario;
      // mockRepo
      (mockPrisma.$transaction as jest.MockedFunction<TxMock>).mockImplementation(async (cb) =>
        cb(mockPrisma as Prisma.TransactionClient),
      );
      setUpMockRepos({ mockOrderRepo, mockData: mocks });

      // when
      const result = await mockOrderService.createOrder(input);

      // then
      // 시나리오 생성하는 시점에 비즈니스 로직 흐름에 맞게 데이터를 고정해둬서 검증 순서는 상관 없음
      // 기본 주문 완료 검증
      expectBaseOrderCreated({
        result,
        mockOrderRepo,
        mockPrisma,
        scenario,
      });
      // 포인트 사용 검증
      expectPointUsed({ mockOrderRepo, mockPrisma, scenario });
      // 포인트 적립 검증
      expectPointEarn({ mockOrderRepo, mockPrisma, scenario });
      // 포인트 히스토리 검증
      expectPointHistory({ mockOrderRepo, mockPrisma, scenario });
      // 재고 감소 검증
      expectDecreaseStock({ mockOrderRepo, mockPrisma, scenario });
      // 판매자 알림 생성 검증
      expectCreateSellerNotification({ mockNotificationService, mockPrisma, scenario });
      // 장바구니 유저 알림 생성 검증
      expectCreateBuyerNotification({ mockNotificationService, mockPrisma, scenario });
      // 판매자 알림 발송 검증
      expectSellerNotificationSend({ mockSseManager, scenario });
      // 장바구니 유저 알림 발송 검증
      expectBuyerNotificationSend({ mockSseManager, scenario });
      // 유저 등급 업데이트 검증
      expectUpdateUserGrade({ mockUserService });
      // 상품 최종 가격 검증
      expectFinalPrice(scenario, 27000); // 포인트 사용, 할인 적용된 최종 값 검증
    });
    it('주문 성공 (다중 상품, 포인트 사용 O, 알림 발송 O, 할인(상시 할인) O)', async () => {
      // given
      const scenario = setupCreateOrderScenario({
        usePoint: 1000,
        orderItems: [
          createScenarioItem({
            stockQuantity: 1, // 1개 사면 품절되는 상황 발생 -> 알림 발송
            itemPrice: 10000,
          }),
          createScenarioItem({
            productId: 'product-id-2',
            sizeId: 2,
            quantity: 2,
            stockQuantity: 10,
            itemPrice: 10000,
            discountRate: 20, // 20% 할인
          }),
        ],
      });
      const { input, mocks } = scenario;
      // mockRepo
      (mockPrisma.$transaction as jest.MockedFunction<TxMock>).mockImplementation(async (cb) =>
        cb(mockPrisma as Prisma.TransactionClient),
      );
      setUpMockRepos({ mockOrderRepo, mockData: mocks });

      // when
      const result = await mockOrderService.createOrder(input);

      // then
      // 시나리오 생성하는 시점에 비즈니스 로직 흐름에 맞게 데이터를 고정해둬서 검증 순서는 상관 없음
      // 기본 주문 완료 검증
      expectBaseOrderCreated({
        result,
        mockOrderRepo,
        mockPrisma,
        scenario,
      });
      // 포인트 사용 검증
      expectPointUsed({ mockOrderRepo, mockPrisma, scenario });
      // 포인트 적립 검증
      expectPointEarn({ mockOrderRepo, mockPrisma, scenario });
      // 포인트 히스토리 검증
      expectPointHistory({ mockOrderRepo, mockPrisma, scenario });
      // 재고 감소 검증
      expectDecreaseStock({ mockOrderRepo, mockPrisma, scenario });
      // 판매자 알림 생성 검증
      expectCreateSellerNotification({ mockNotificationService, mockPrisma, scenario });
      // 장바구니 유저 알림 생성 검증
      expectCreateBuyerNotification({ mockNotificationService, mockPrisma, scenario });
      // 판매자 알림 발송 검증
      expectSellerNotificationSend({ mockSseManager, scenario });
      // 장바구니 유저 알림 발송 검증
      expectBuyerNotificationSend({ mockSseManager, scenario });
      // 유저 등급 업데이트 검증
      expectUpdateUserGrade({ mockUserService });
      // 상품 최종 가격 검증
      expectFinalPrice(scenario, 25000);
    });
  });
});
