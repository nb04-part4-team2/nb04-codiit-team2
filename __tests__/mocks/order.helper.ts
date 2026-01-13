import {
  createGetOrderMock,
  createGetProductsInfoMock,
  createGetUserInfoMock,
  createNotificationInputMock,
  createOrderItemMock,
  createOrderItemInputMock,
  createOrderMock,
  createOrderRepoInputMock,
  createOrderServiceInputMock,
  createPaymentMock,
  createPointHistoryInputMock,
  createPointInputMock,
  createProductInfoMock,
  createProductMock,
  createStockOutputMock,
  createOrderItemsRepoInputMock,
  createGetOrderFromPaymentMock,
  createOrderFromPaymentMock,
  createStockInputMock,
  createStockDataMock,
  createStockProductMock,
  createStockStoreMock,
  createStockCartItemMock,
  createStockCartMock,
  createStockSizeMock,
} from './order.mock.js';
import { OrderStatus, PaymentStatus, PointHistoryType } from '@prisma/client';
import { buildOrderData } from '@/domains/order/order.utils.js';
import { CreateOrderItemBody } from '@/domains/order/order.schema.js';
import {
  ExpectNotificationInput,
  ExpectPointInput,
  ExpectSendNotificationInput,
  ExpectStockInput,
  ExpectUserGradeInput,
  ScenarioItemOption,
  CreateScenarioResult,
  CreateOrderScenarioOptions,
  DeleteOrderScenarioOptions,
  DeleteScenarioResult,
  SetupDeleteOrderMockReposInput,
  ExpectDeleteBaseInput,
  SetupCreateOnlyOrderMockReposInput,
  SetupOrderTxMockReposInput,
  ExpectOnlyOrderCreateInput,
  OrderTxResult,
  ExpectUpdateStatusInput,
  ExpectOrderInput,
  ExpectUserInfo,
  OrderTxScenarioOptions,
  ExpectPaymentStatus,
  ExpectUpdatePaymentStatus,
  ExpectOrderStatus,
  ExpectResult,
  ExpectOrderTxInput,
} from '@/domains/order/order.type.js';
import {
  DecreaseStockRawData,
  ProductInfoRawData,
  UpdateStockRepoInput,
} from '@/domains/order/order.dto.js';
import { CreateNotificationBody } from '@/domains/notification/notification.type.js';
import { createSizeMock } from './cart.mock.js';

// 전역 mock
const sellerId = 'seller-id-1';
const otherBuyerId = 'otherBuyer-id-1';
const SIZE_MAP: Record<number, { en: string; ko: string }> = {
  1: { en: 'XS', ko: '엑스스몰' },
  2: { en: 'S', ko: '스몰' },
  3: { en: 'M', ko: '미디엄' },
  4: { en: 'L', ko: '라지' },
  5: { en: 'XL', ko: '엑스라지' },
  6: { en: 'Free', ko: '프리' },
};

// ============================================
// 목 데이터 팩토리들을 조합해 테스트 시나리오 생성
// ============================================
/**
 * [시나리오] 주문 생성 테스트를 위한 데이터 세트 조립 (Object Mother)
 */
export const setupOnlyCreateOrderScenario = (
  options: CreateOrderScenarioOptions = {},
): CreateScenarioResult => {
  const {
    userId = 'buyer-id-1',
    usePoint = 0,
    userPoint = 10000, // 유저가 가지고 있는 포인트
    stockQuantity = 10, // 기본은 재고 여유
    itemsPrice = 10000,
    itemsQuantity = 1,
    orderItems = [
      {
        ...createOrderItemInputMock({
          productId: 'product-id-1',
          sizeId: 1,
          quantity: itemsQuantity,
        }),
        // 각 아이템의 할인 여부 및 할인율도 입력 가능
        discountRate: 0,
        discountStartTime: null,
        discountEndTime: null,
      },
    ] as ScenarioItemOption[],
  } = options;

  // 서비스 input용 orderItems 배열
  const mockOrderItemsInput: CreateOrderItemBody[] = [];
  // 상품 정보 조회시 각 상품별 재고 설정을 위한 해시맵
  const productInfoMap: Record<string, ProductInfoRawData> = {};
  // 정보를 조회할 상품들의 id
  const productIds: string[] = [];

  // 주문 로직에 필요한 객체들 생성
  orderItems.forEach((item, index) => {
    // 주문할 상품의 productId
    const productId = item.productId ?? `product-id-${index + 1}`;
    // 주문할 상품의 sizeId
    const sizeId = item.sizeId ?? 1;
    // 주문할 수량
    const orderQuantity = item.quantity ?? 1;
    // 주문할 상품의 재고
    const itemStockQuantity = item.stockQuantity ?? stockQuantity;
    // 주문할 아이템의 가격
    const itemPrice = item.itemPrice ?? itemsPrice;
    // 할인율 정보
    const discountRate = item.discountRate;
    // 할인 시작 시간
    const discountStartTime = item.discountStartTime;
    // 할인 종료 시간
    const discountEndTime = item.discountEndTime;

    productIds.push(productId);

    // 1. 서비스 인풋용 orderItems mock 생성
    mockOrderItemsInput.push(
      createOrderItemInputMock({
        productId,
        sizeId,
        quantity: orderQuantity,
      }),
    );

    // 2. 상품 정보 조회 output mock 생성
    if (!productInfoMap[productId]) {
      // 상품이 처음 나오면 기본 틀 생성
      productInfoMap[productId] = createProductInfoMock({
        id: productId,
        price: itemPrice,
        discountRate,
        discountStartTime,
        discountEndTime,
        stocks: [], // 빈 배열로 시작
      });
    }
    // 각 상품에 사이즈별 재고를 설정 (입력값 없는 경우 기본 설정)
    productInfoMap[productId].stocks.push(
      createStockOutputMock({
        sizeId,
        quantity: itemStockQuantity,
      }),
    );

    if (itemStockQuantity < orderQuantity) {
      // 주문 수량보다 아이템의 재고가 적으면 안됨 -> 이 경우는 실패 시나리오
      // 성공 시나리오에서 이 상황은 에러 처리
      throw new Error(
        `Invalid success scenario: stock(${itemStockQuantity}) < order(${orderQuantity})`,
      );
    }
  });

  // 2. Mock Data 생성 (부품 조립)
  // 2-1. 유저 정보 (기본 포인트 10,000)
  const userInfoOutput = createGetUserInfoMock({ point: userPoint }); // 사용 포인트보다 보유 포인트가 적은 상황 테스트 가능

  // 2-2. 상품 정보 (재고 설정 포함)
  const productsInfoOutput = createGetProductsInfoMock(Object.values(productInfoMap));

  // 2-3. 서비스 입력값 (Input)
  const orderServiceInput = createOrderServiceInputMock({
    userId,
    usePoint,
    orderItems: mockOrderItemsInput,
  });

  const builtData = buildOrderData(productsInfoOutput, orderServiceInput.orderItems);
  const subtotal = builtData.subtotal;
  const totalQuantity = builtData.totalQuantity;

  // 2-5. Repository 입력값 세팅 (Repo Input)
  // 2-5-1. 주문 생성 Repo Input
  const orderRepoInput = createOrderRepoInputMock({
    subtotal,
    totalQuantity,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    ...orderServiceInput, // 팩토리에서 orderItems는 자동으로 걸러짐
  });

  // 2-5-2. 주문 아이템 생성 Repo Input
  const orderItemsRepoInput = createOrderItemsRepoInputMock(builtData.matchedOrderItems);

  // 2-6. Repository 반환값 예상 (Output)
  // 주문 생성 Repo output
  const orderRepoOutput = createOrderMock({ subtotal, totalQuantity: builtData.totalQuantity });
  // 주문 상세 조회 Repo output (주문 생성 로직의 반환 값)
  const getOrderOutput = createGetOrderMock({
    id: orderRepoOutput.id,
    buyerId: userId,
    subtotal,
    totalQuantity: builtData.totalQuantity,
    usePoint,
    orderItems: builtData.matchedOrderItems.map((item, index) =>
      createOrderItemMock({
        id: `order-item-id-${index + 1}`,
        productId: item.productId,
        price: item.price,
        quantity: item.quantity,
        product: createProductMock({
          name: productInfoMap[item.productId].name,
        }),
        size: createSizeMock({
          id: item.sizeId,
          en: SIZE_MAP[item.sizeId].en,
          ko: SIZE_MAP[item.sizeId].ko,
        }),
      }),
    ),
    payments: [createPaymentMock()],
  });
  const finalPrice = getOrderOutput.subtotal - getOrderOutput.usePoint;

  // 4. 모든 것을 묶어서 반환
  return {
    input: orderServiceInput, // 서비스 input
    mocks: {
      // 레포지토리의 리턴 값
      userInfoOutput,
      productsInfoOutput,
      orderRepoOutput,
      getOrderOutput,
    },
    verify: {
      // 검증에 쓸 객체들
      finalPrice,
      productIds,
      orderRepoInput,
      orderItemsRepoInput,
    },
  };
};

export const setupOrderTxScenario = (options: OrderTxScenarioOptions = {}): OrderTxResult => {
  // 0. 옵션 및 기본값 설정
  const {
    userPoint,
    stockQuantity = 10,
    paymentStatus = { status: PaymentStatus.paid },
    orderStatus = { status: OrderStatus.WaitingPayment },
    order = createOrderFromPaymentMock({
      orderItems: [createOrderItemMock()],
    }),
  } = options;

  // 주문한 상품들 재고 감소 정보 배열
  const decreaseStockRepoInput: UpdateStockRepoInput[] = [];
  // 재고 감소 반영 후 재고 및 연관 데이터 반환 값
  const updatedStockOutput: DecreaseStockRawData[] = [];
  // 판매자 품절 알림 input 배열
  const notificationSellerInput: CreateNotificationBody[] = [];
  // 장바구니에 아이템을 넣어둔 유저에게 해당 사이즈 품절 알림 발송 input 배열
  // 상품별 유저목록이라 이중배열
  const notificationBuyerInput: CreateNotificationBody[][] = [];

  const orderFromPaymentOutput = createGetOrderFromPaymentMock({ order });

  const { id: orderId, usePoint, buyerId, orderItems } = orderFromPaymentOutput.order;
  const { subtotal, totalQuantity } = orderItems.reduce(
    (acc, item) => {
      acc.subtotal += item.price * item.quantity;
      acc.totalQuantity += item.quantity;
      return acc;
    },
    { subtotal: 0, totalQuantity: 0 },
  );

  // 2. Mock Data 생성 (부품 조립)
  // 2-1. 유저 정보 (기본 포인트 10,000)
  const userInfoOutput = createGetUserInfoMock({ point: userPoint }); // 사용 포인트보다 보유 포인트가 적은 상황 테스트 가능

  // 2-3 포인트 차감
  // 2-3-1 포인트 차감 Repo Input
  const decreasePointRepoInput = createPointInputMock({
    userId: buyerId,
    amount: usePoint,
  });
  // 2-3-2. 포인트 차감 히스토리 Repo input
  const decreasePointHistoryRepoInput = createPointHistoryInputMock();

  // 2-4. 재고 감소 Repo Input
  orderItems.map((item, index) => {
    // 사이즈 정보
    const sizeInfo = SIZE_MAP[item.size.id];

    // 3. 재고 감소 mock 생성
    // 상품별 주문 수량 배열
    decreaseStockRepoInput.push(
      createStockInputMock({
        productId: item.productId,
        sizeId: item.size.id,
        quantity: item.quantity,
      }),
    );
    // 재고 감소 후 반환 객체 (알림 발송을 위해 연관 도메인도 조회)
    updatedStockOutput.push(
      createStockDataMock({
        productId: item.productId,
        sizeId: item.size.id,
        quantity: stockQuantity - item.quantity,
        product: createStockProductMock({
          store: createStockStoreMock({ userId: sellerId }),
          cartItems: [
            createStockCartItemMock({
              sizeId: item.size.id,
              cart: createStockCartMock({ buyerId: otherBuyerId }),
            }),
          ],
        }),
        size: createStockSizeMock({ id: item.size.id, en: sizeInfo.en, ko: sizeInfo.ko }),
      }),
    );

    // 실제 비즈니스 로직 형태로 진행
    if (updatedStockOutput[index].quantity === 0) {
      // 2-4-1. 품절 알림 생성 Repo Input
      const productName = updatedStockOutput[index].product.name;
      const sizeName = updatedStockOutput[index].size.en;
      const cartItems = updatedStockOutput[index].product.cartItems;
      const updatedSizeId = updatedStockOutput[index].sizeId;

      // 2-4-2. 판매자 알림 생성
      notificationSellerInput.push(
        createNotificationInputMock({
          userId: sellerId,
          content: `${productName}의 ${sizeName} 사이즈가 품절되었습니다.`,
        }),
      );

      // 2-4-3. 장바구니에 해당 아이템을 담은 유저들 알림 생성
      const cartUserIds = [
        ...new Set(
          cartItems
            .filter((item) => item.sizeId === updatedSizeId && item.cart.buyerId !== buyerId)
            .map((item) => item.cart.buyerId),
        ),
      ];
      if (cartUserIds.length > 0) {
        const currentProductNotifications = cartUserIds.map((uid) =>
          createNotificationInputMock({
            userId: uid,
            content: `장바구니에 담은 상품 ${productName}의 ${sizeName} 사이즈가 품절되었습니다.`,
          }),
        );
        notificationBuyerInput.push(currentProductNotifications);
      }
    }
  });

  // 2-5 결제 정보 조회
  const paymentPrice = { price: subtotal - usePoint };

  const finalPrice = paymentPrice.price; // 사용 포인트를 뺀 실제 결제 금액
  if (finalPrice < 0 || userInfoOutput.grade.rate < 0) {
    // 성공 시나리오에서는 상품 금액 총 합보다 포인트를 더 많이 사용할 수 없음
    // 그리고 적립률 또한 음수를 넣으면 안됨
    // 사용자가 테스트 데이터를 잘못 설정한 경우 에러
    throw new Error(`Invalid success scenario: finalPrice < 0`);
  }
  // 유저 등급에 따른 적립 포인트 계산
  const earnedPoint = Math.floor(finalPrice * userInfoOutput.grade.rate);

  // 2-6. 포인트 적립 Repo input
  const increasePointRepoInput = createPointInputMock({ amount: earnedPoint });
  // 2-6-1. 포인트 적립 히스토리 Repo input
  const increasePointHistoryRepoInput = createPointHistoryInputMock({
    amount: earnedPoint,
    type: PointHistoryType.EARN,
  });

  // 2-7. 주문 완료 알림 input
  const completedOrderNotificationInput = createNotificationInputMock({
    userId: buyerId,
    content: `주문이 완료되었습니다. 주문번호: ${orderId}`,
  });

  // 2-6. Repository 반환값 예상 (Output)
  // 주문 상세 조회 Repo output (주문 생성 로직의 반환 값)
  const getOrderOutput = createGetOrderMock({
    id: orderId,
    buyerId,
    subtotal,
    totalQuantity,
    usePoint,
    orderItems: orderItems.map((item, index) =>
      createOrderItemMock({
        id: `order-item-id-${index + 1}`,
        productId: item.productId,
        price: item.price,
        quantity: item.quantity,
        product: createProductMock({
          name: item.product.name,
        }),
        size: createSizeMock({
          id: item.size.id,
          en: SIZE_MAP[item.size.id].en,
          ko: SIZE_MAP[item.size.id].ko,
        }),
      }),
    ),
    payments: [createPaymentMock()],
  });

  // 3. 성공 시나리오에 따라 필요한 데이터 분리
  const verifyUsePoint =
    usePoint > 0
      ? {
          decreasePointRepoInput,
          decreasePointHistoryRepoInput,
        }
      : undefined;

  // 4. 모든 것을 묶어서 반환
  return {
    mocks: {
      // 레포지토리의 리턴 값
      orderFromPaymentOutput,
      userInfoOutput,
      paymentStatus,
      orderStatus,
      updatedStockOutput,
      paymentPrice,
      getOrderOutput,
    },
    verify: {
      // 검증에 쓸 객체들
      ...verifyUsePoint,
      decreaseStockRepoInput,
      notificationSellerInput,
      notificationBuyerInput,
      increasePointRepoInput,
      increasePointHistoryRepoInput,
      completedOrderNotificationInput,
    },
  };
};

/**
 * [시나리오] 주문 삭제 테스트를 위한 데이터 세트 조립 (Object Mother)
 * 기본적으로 포인트를 사용하지도 않고 적립하지도 않았던 경우로 설정
 */
export const setupDeleteOrderScenario = (
  options: DeleteOrderScenarioOptions = {},
): DeleteScenarioResult => {
  // 0. 기본 값 설정
  const {
    orderId = 'order-id-1',
    userId = 'buyer-id-1',
    usePoint = 0,
    orderStatus = { status: OrderStatus.CompletedPayment }, // 주문 상태 조회 output
    orderItems = [createOrderItemMock()],
    payments = [createPaymentMock({ status: 'completed' })],
  } = options;

  // 1. 주문 데이터 조회 output
  const getOrderOutput = createGetOrderMock({
    id: orderId,
    buyerId: userId,
    usePoint,
    payments,
    orderItems: orderItems.map((item) => createOrderItemMock(item)),
  });

  const targetPayment = getOrderOutput.payments.find(
    (payment) => payment.status === PaymentStatus.completed,
  );
  const targetPaymentId = targetPayment!.id;

  // 2. 재고 복구 repo input
  const restoreStockDatas = getOrderOutput.orderItems.map((item) => {
    return {
      productId: item.productId,
      sizeId: item.size.id,
      quantity: item.quantity,
    };
  });

  // 3. 유저 정보 조회 Output
  const userInfoOutput = createGetUserInfoMock({
    point: 10000, // 포인트 넉넉하게 기본 설정
  });

  // 4. 포인트 적립내역 조회 input
  const { amount: _amount, ...pointHistoryRepoInput } = createPointHistoryInputMock({
    type: PointHistoryType.EARN,
  });

  return {
    mocks: {
      getOrderOutput,
      orderStatus,
      userInfoOutput,
    },
    verify: {
      userId,
      orderId,
      targetPaymentId,
      restoreStockDatas,
      pointHistoryRepoInput,
    },
  };
};
// ============================================
// repo output 모킹
// ============================================
/**
 * 기본 주문 생성 mock 설정 코드
 */
export const setUpCreateOnlyOrderMockRepos = ({
  mockOrderRepo,
  mockData,
}: SetupCreateOnlyOrderMockReposInput) => {
  mockOrderRepo.findUserInfo.mockResolvedValue(mockData.userInfoOutput);
  mockOrderRepo.findManyProducts.mockResolvedValue(mockData.productsInfoOutput);
  mockOrderRepo.createOrder.mockResolvedValue(mockData.orderRepoOutput);
  mockOrderRepo.findById.mockResolvedValue(mockData.getOrderOutput);
  mockOrderRepo.reserveStock.mockResolvedValue(1); // raw query라서 성공하면 그냥 1을 반환
};
/**
 * 주문 트랜잭션 mock 기본 설정 코드
 */
export const setUpOrderTxMockRepos = ({ mockOrderRepo, mockData }: SetupOrderTxMockReposInput) => {
  mockOrderRepo.findPaymentWithOrder.mockResolvedValue(mockData.orderFromPaymentOutput);
  mockOrderRepo.findUserInfo.mockResolvedValue(mockData.userInfoOutput);
  mockOrderRepo.findPaymentStatusById.mockResolvedValue(mockData.paymentStatus);
  mockOrderRepo.findStatusById.mockResolvedValue(mockData.orderStatus);
  mockOrderRepo.decreaseStock.mockResolvedValue(1); // 재고 감소 성공 모킹
  mockData.updatedStockOutput.forEach((stock) => {
    mockOrderRepo.getStockData.mockResolvedValueOnce(stock); // 재고 데이터 조회 모킹
  });
  mockOrderRepo.getPaymentPrice.mockResolvedValue(mockData.paymentPrice);
  mockOrderRepo.findById.mockResolvedValue(mockData.getOrderOutput);
};
/**
 * 삭제 로직 공통 mock 설정
 */
export const setUpDeleteOrderMockRepos = ({
  mockOrderRepo,
  mockData,
}: SetupDeleteOrderMockReposInput) => {
  mockOrderRepo.findById.mockResolvedValue(mockData.getOrderOutput);
  mockOrderRepo.findStatusById.mockResolvedValue(mockData.orderStatus);
  mockOrderRepo.findUserInfo.mockResolvedValue(mockData.userInfoOutput);
  mockOrderRepo.findPointHistory.mockResolvedValue(null);
};
// ============================================
// 성공 시나리오 expect
// ============================================
/**
 * 성공 시나리오 공통 expect 코드
 * (기본 데이터 가공 + 주문 성공만 검증)
 */
export const expectBaseOrderCreated = ({
  result,
  mockOrderRepo,
  mockPrisma,
  scenario,
}: ExpectOnlyOrderCreateInput) => {
  const { input, mocks, verify } = scenario;
  // 1. 데이터 가공
  // 1-1. 검증 로직 호출 확인 (방어 로직)
  expect(mockOrderRepo.findUserInfo).toHaveBeenCalledTimes(1);
  expect(mockOrderRepo.findUserInfo).toHaveBeenCalledWith(input.userId);

  // 1-2. 주문 생성 데이터 가공을 위한 상품 목록 조회
  verify.orderRepoInput.expiresAt = expect.any(Date);
  // 서비스에서 지정한 시간이랑 테스트에서 지정한 시간이랑 밀리초 단위 오차가 생겨서
  // Date타입이라는 것만 검증
  expect(mockOrderRepo.findManyProducts).toHaveBeenCalledTimes(1);
  expect(mockOrderRepo.findManyProducts).toHaveBeenCalledWith(verify.productIds);

  // 2. 트랜잭션 내부 로직 호출 확인
  // 2-0. 재고 락
  const expectedCallCount = input.orderItems.length;
  expect(mockOrderRepo.reserveStock).toHaveBeenCalledTimes(expectedCallCount);
  // 재고 락 수행 검증
  input.orderItems.forEach((item) => {
    expect(mockOrderRepo.reserveStock).toHaveBeenCalledWith(
      {
        productId: item.productId,
        sizeId: item.sizeId,
        quantity: item.quantity,
      },
      mockPrisma,
    );
  });

  // 2-1. 주문 생성
  expect(mockOrderRepo.createOrder).toHaveBeenCalledTimes(1);
  expect(mockOrderRepo.createOrder).toHaveBeenCalledWith(verify.orderRepoInput, mockPrisma);

  // 2-2. 주문 아이템 생성
  expect(mockOrderRepo.createOrderItems).toHaveBeenCalledTimes(1);
  expect(mockOrderRepo.createOrderItems).toHaveBeenCalledWith(
    verify.orderItemsRepoInput,
    mockPrisma,
  );

  // 3. 최종 결과 조회 호출 확인
  expect(mockOrderRepo.findById).toHaveBeenCalledWith(mocks.orderRepoOutput.id);

  // 4. 최종 반환값 검증 (주문 생성 결과가 제대로 리턴되었는지)
  expect(result).toEqual(mocks.getOrderOutput);
};
/**
 * 주문 트랜잭션 기본 검증
 * (기본 expect)
 */
export const expectBaseOrderTx = ({
  mockNotificationService,
  mockSseManager,
  mockUserService,
  mockOrderRepo,
  paymentId,
  mockPrisma,
  scenario,
  result,
}: ExpectOrderTxInput) => {
  const { verify, mocks } = scenario;
  // 1. 주문 정보 조회
  expect(mockOrderRepo.findPaymentWithOrder).toHaveBeenCalledTimes(1);
  expect(mockOrderRepo.findPaymentWithOrder).toHaveBeenCalledWith(paymentId);

  // 2. 유저 정보 조회
  expect(mockOrderRepo.findUserInfo).toHaveBeenCalledTimes(1);
  expect(mockOrderRepo.findUserInfo).toHaveBeenCalledWith(
    mocks.orderFromPaymentOutput.order.buyerId,
  );

  // 3. 결제 상태 조회
  expect(mockOrderRepo.findPaymentStatusById).toHaveBeenCalledWith(paymentId, mockPrisma);
  expect(mockOrderRepo.findPaymentStatusById).toHaveBeenCalledTimes(1);

  // 4. 결제 상태 업데이트
  expect(mockOrderRepo.updatePaymentStatus).toHaveBeenNthCalledWith(
    1,
    paymentId,
    PaymentStatus.processing,
    mockPrisma,
  );
  expect(mockOrderRepo.updatePaymentStatus).toHaveBeenNthCalledWith(
    2,
    paymentId,
    PaymentStatus.completed,
    mockPrisma,
  );
  expect(mockOrderRepo.updatePaymentStatus).toHaveBeenCalledTimes(2);

  // 5. 주문 상태 조회
  expect(mockOrderRepo.findStatusById).toHaveBeenCalledWith(
    mocks.orderFromPaymentOutput.order.id,
    mockPrisma,
  );
  expect(mockOrderRepo.findStatusById).toHaveBeenCalledTimes(1);

  // 6. 재고 감소
  expect(mockOrderRepo.decreaseStock).toHaveBeenCalledTimes(
    mocks.orderFromPaymentOutput.order.orderItems.length,
  );
  verify.decreaseStockRepoInput.forEach((stockInput) => {
    expect(mockOrderRepo.decreaseStock).toHaveBeenCalledWith(stockInput, mockPrisma);
    expect(mockOrderRepo.getStockData).toHaveBeenCalledWith(
      { productId: stockInput.productId, sizeId: stockInput.sizeId },
      mockPrisma,
    );
  });

  // 7. 결제 금액 조회
  expect(mockOrderRepo.getPaymentPrice).toHaveBeenCalledWith(paymentId, mockPrisma);

  // 8. 주문 상태 업데이트
  expect(mockOrderRepo.updateStatus).toHaveBeenCalledTimes(1);
  expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith(
    mocks.orderFromPaymentOutput.order.id,
    OrderStatus.CompletedPayment,
    mockPrisma,
  );

  // 9. 최종 결과 조회
  // 9-1. 최종 결과 조회 호출 확인
  expect(mockOrderRepo.findById).toHaveBeenCalledWith(mocks.orderFromPaymentOutput.order.id);

  // 9-2. 최종 반환값 검증 (주문 생성 결과가 제대로 리턴되었는지)
  expect(result).toEqual(mocks.getOrderOutput);

  // 10. 주문 완료 알림 생성
  const notification = verify.completedOrderNotificationInput;
  expect(mockSseManager.sendMessage).toHaveBeenCalledWith(notification.userId, {
    userId: notification.userId,
    content: notification.content,
  });

  // 11. 주문 완료 알림 발송
  expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
    verify.completedOrderNotificationInput,
  );

  // 12. 유저 등급 업데이트
  expect(mockUserService.updateGradeByPurchase).toHaveBeenCalledTimes(1);
};
/**
 * 유저 정보 조회 expect
 */
export const expectUserInfo = ({ mockOrderRepo, buyerId }: ExpectUserInfo) => {
  expect(mockOrderRepo.findUserInfo).toHaveBeenCalledTimes(1);
  expect(mockOrderRepo.findUserInfo).toHaveBeenCalledWith(buyerId);
};
/**
 * 주문 정보 조회 expect
 */
export const expectGetOrderInfo = ({ mockOrderRepo, paymentId }: ExpectOrderInput) => {
  expect(mockOrderRepo.findPaymentWithOrder).toHaveBeenCalledTimes(1);
  expect(mockOrderRepo.findPaymentWithOrder).toHaveBeenCalledWith(paymentId);
};
/**
 * 주문 상태 업데이트 expect
 */
export const expectUpdateStatus = ({
  mockOrderRepo,
  mockPrisma,
  scenario,
}: ExpectUpdateStatusInput) => {
  const { mocks } = scenario;
  expect(mockOrderRepo.updateStatus).toHaveBeenCalledTimes(1);
  expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith(
    mocks.orderFromPaymentOutput.order.id,
    OrderStatus.CompletedPayment,
    mockPrisma,
  );
};

/**
 * 포인트 적립 expect
 */
export const expectPointEarn = ({ mockOrderRepo, mockPrisma, scenario }: ExpectPointInput) => {
  const { verify } = scenario;
  // 포인트 적립 (적립금이 0보다 큰 경우)
  expect(mockOrderRepo.increasePoint).toHaveBeenCalledTimes(1);
  expect(mockOrderRepo.increasePoint).toHaveBeenCalledWith(
    verify.increasePointRepoInput,
    mockPrisma,
  );
};
/**
 * 포인트 사용 expect
 */
export const expectPointUsed = ({ mockOrderRepo, mockPrisma, scenario }: ExpectPointInput) => {
  const { verify } = scenario;
  // 포인트 사용
  expect(mockOrderRepo.decreasePoint).toHaveBeenCalledTimes(1);
  expect(mockOrderRepo.decreasePoint).toHaveBeenCalledWith(
    verify.decreasePointRepoInput,
    mockPrisma,
  );
};
/**
 * 포인트 히스토리 횟수 expect
 */
export const expectPointHistory = ({ mockOrderRepo, mockPrisma, scenario }: ExpectPointInput) => {
  const { verify } = scenario;
  // 포인트 사용 및 적립 검증
  // 포인트를 사용만 한 경우, 포인트 사용도 하고 적립도 하는 경우 대응 가능
  let expectedHistoryCalls = 0;
  // 1. 포인트 사용 검증 (데이터가 있을 때만 체크)
  if (verify.decreasePointHistoryRepoInput) {
    expectedHistoryCalls++; // 횟수 증가
    expect(mockOrderRepo.createPointHistory).toHaveBeenCalledWith(
      verify.decreasePointHistoryRepoInput,
      mockPrisma,
    );
  }
  // 2. 포인트 적립 검증 (데이터가 있을 때만 체크)
  if (verify.increasePointHistoryRepoInput) {
    expectedHistoryCalls++; // 횟수 증가
    expect(mockOrderRepo.createPointHistory).toHaveBeenCalledWith(
      verify.increasePointHistoryRepoInput,
      mockPrisma,
    );
  }
  // 3. 총 호출 횟수 검증 (0번, 1번, 2번 모두 대응 가능!)
  expect(mockOrderRepo.createPointHistory).toHaveBeenCalledTimes(expectedHistoryCalls);
};
/**
 * 재고 감소 expect
 */
export const expectDecreaseStock = ({ mockOrderRepo, mockPrisma, scenario }: ExpectStockInput) => {
  const { mocks, verify } = scenario;
  // 재고 감소 (주문 아이템 개수만큼 호출되었는지)
  expect(mockOrderRepo.decreaseStock).toHaveBeenCalledTimes(
    mocks.orderFromPaymentOutput.order.orderItems.length,
  );
  verify.decreaseStockRepoInput.forEach((stockInput) => {
    expect(mockOrderRepo.decreaseStock).toHaveBeenCalledWith(stockInput, mockPrisma);
  });
};
/**
 * 장바구니에 넣은 유저 알림 생성 expect
 */
export const expectCreateBuyerNotification = ({
  mockNotificationService,
  mockPrisma,
  scenario,
}: ExpectNotificationInput) => {
  const { verify } = scenario;
  const notifications = verify.notificationBuyerInput;
  expect(mockNotificationService.createBulkNotifications).toHaveBeenCalledTimes(
    notifications.length,
  );
  notifications.forEach((notification) => {
    expect(mockNotificationService.createBulkNotifications).toHaveBeenCalledWith(
      notification,
      mockPrisma,
    );
  });
};
/**
 * 판매자 알림 생성 expect
 */
export const expectCreateSellerNotification = ({
  mockNotificationService,
  mockPrisma,
  scenario,
}: ExpectNotificationInput) => {
  const { verify } = scenario;
  const notifications = verify.notificationSellerInput;
  notifications.forEach((notification) => {
    expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
      notification,
      mockPrisma,
    );
  });
};
/**
 * 장바구니에 넣은 유저 알림 발송 expect
 */
export const expectBuyerNotificationSend = ({
  mockSseManager,
  scenario,
}: ExpectSendNotificationInput) => {
  const { verify } = scenario;
  // 한 상품을 여러 구매자가 넣었을 수 있으므로 이중 배열구조라서 flat 필요
  const notifications = verify.notificationBuyerInput.flat();
  notifications.forEach((notification) => {
    expect(mockSseManager.sendMessage).toHaveBeenCalledWith(notification.userId, {
      userId: notification.userId,
      content: notification.content,
    });
  });
};
/**
 * 판매자 알림 발송 expect
 */
export const expectSellerNotificationSend = ({
  mockSseManager,
  scenario,
}: ExpectSendNotificationInput) => {
  const { verify } = scenario;
  const notifications = verify.notificationSellerInput;
  notifications.forEach((notification) => {
    expect(mockSseManager.sendMessage).toHaveBeenCalledWith(notification.userId, {
      userId: notification.userId,
      content: notification.content,
    });
  });
};
/**
 * 유저 등급 업데이트 expect
 */
export const expectUpdateUserGrade = ({ mockUserService }: ExpectUserGradeInput) => {
  // 유저 등급 업데이트
  expect(mockUserService.updateGradeByPurchase).toHaveBeenCalledTimes(1);
};
/**
 * 할인, 포인트 사용 등이 적용된 최종 결제 가격 expect
 */
export const expectFinalPrice = (scenario: OrderTxResult, expectedFinalPrice: number) => {
  const { mocks } = scenario;
  expect(mocks.paymentPrice.price).toBe(expectedFinalPrice);
};
/**
 * 결제 상태 조회 expect
 */
export const expectPaymentStatus = ({
  mockOrderRepo,
  paymentId,
  mockPrisma,
}: ExpectPaymentStatus) => {
  expect(mockOrderRepo.findPaymentStatusById).toHaveBeenCalledWith(paymentId, mockPrisma);
  expect(mockOrderRepo.findPaymentStatusById).toHaveBeenCalledTimes(1);
};

/**
 * 결제 정보 업데이트 expect
 * (결제 상태 락, 락 해제)
 */
export const expectUpdatePaymentStatus = ({
  paymentId,
  mockPrisma,
  mockOrderRepo,
}: ExpectUpdatePaymentStatus) => {
  expect(mockOrderRepo.updatePaymentStatus).toHaveBeenNthCalledWith(
    1,
    paymentId,
    PaymentStatus.processing,
    mockPrisma,
  );
  expect(mockOrderRepo.updatePaymentStatus).toHaveBeenNthCalledWith(
    2,
    paymentId,
    PaymentStatus.completed,
    mockPrisma,
  );
  expect(mockOrderRepo.updatePaymentStatus).toHaveBeenCalledTimes(2);
};

/**
 * 주문 상태 조회 expect
 */
export const expectOrderStatus = ({ mockOrderRepo, mockPrisma, orderId }: ExpectOrderStatus) => {
  expect(mockOrderRepo.findStatusById).toHaveBeenCalledWith(orderId, mockPrisma);
  expect(mockOrderRepo.findStatusById).toHaveBeenCalledTimes(1);
};

/**
 * 최종 결과 조회 expect
 */
export const expectResult = ({ mockOrderRepo, scenario, result }: ExpectResult) => {
  const { mocks } = scenario;
  // 1. 최종 결과 조회 호출 확인
  expect(mockOrderRepo.findById).toHaveBeenCalledWith(mocks.orderFromPaymentOutput.order.id);

  // 2. 최종 반환값 검증 (주문 생성 결과가 제대로 리턴되었는지)
  expect(result).toEqual(mocks.getOrderOutput);
};

// ============================================
// 주문 취소 시나리오 expect
// ============================================
/**
 * 주문 취소 시나리오 기본 expect
 * (기본 로직 + 주문 취소 검증)
 */
export const expectBaseOrderDeleted = ({
  mockOrderRepo,
  mockUserService,
  mockPrisma,
  mocks,
  verify,
}: ExpectDeleteBaseInput) => {
  expect(mockOrderRepo.findById).toHaveBeenCalledWith(verify.orderId);
  expect(mockOrderRepo.increaseStock).toHaveBeenCalledTimes(verify.restoreStockDatas.length);
  verify.restoreStockDatas.forEach((stockInput) => {
    expect(mockOrderRepo.increaseStock).toHaveBeenCalledWith(stockInput, mockPrisma);
  });
  expect(mockOrderRepo.deletePayment).toHaveBeenCalledWith(verify.targetPaymentId, mockPrisma);
  expect(mockOrderRepo.findUserInfo).toHaveBeenCalledWith(verify.userId, mockPrisma);
  expect(mockOrderRepo.findPointHistory).toHaveBeenCalledWith(
    verify.pointHistoryRepoInput,
    mockPrisma,
  );
  expect(mockOrderRepo.deleteOrder).toHaveBeenCalledWith(mocks.getOrderOutput.id, mockPrisma);
  expect(mockUserService.updateGradeByPurchase).toHaveBeenCalledWith(verify.userId);
};
