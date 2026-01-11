import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createPaymentServiceInputMock } from '../mocks/payment.mock.js';
import { createSellerWithProduct, createTestOrder } from '../helpers/dataFactory.js';
import { generateBuyerToken, generateSellerToken } from '../helpers/authHelper.js';
import { OrderStatus, PaymentMethod, PaymentProvider } from '@prisma/client';
import { createOrderItemMock } from '../mocks/order.mock.js';
import { PaymentCallbackBody } from '@/domains/payment/payment.schema.js';

const mockAxiosPost = jest.fn<(config?: unknown) => Promise<unknown>>();
const mockAxiosGet = jest.fn<(config?: unknown) => Promise<unknown>>();

jest.unstable_mockModule('axios', () => ({
  __esModule: true,
  default: { post: mockAxiosPost, get: mockAxiosGet },
  isAxiosError: jest.fn(),
}));

type TestClientModule = typeof import('../helpers/testClient.js');

describe('Payment API Integration Test', () => {
  // 실제로 포트원에 요청 하지 않도록 모킹해야함
  // app을 모킹 이후에 호출해야함
  let authRequest: TestClientModule['authRequest'];
  let testClient: TestClientModule['testClient'];

  // 기본 데이터
  let buyerId: string;
  let sellerId: string;
  let buyerToken: string;
  let sellerToken: string;
  let productId: string;

  // 주문 데이터
  let orderId: string;
  let subtotal: number;
  let usePoint: number;

  // 결제 데이터
  let method: PaymentMethod;
  let provider: PaymentProvider;

  beforeAll(async () => {
    const module = await import('../helpers/testClient.js');
    authRequest = module.authRequest;
    testClient = module.testClient;
  });

  beforeEach(async () => {
    const { seller, buyer, product } = await createSellerWithProduct();
    buyerId = buyer.id;
    sellerId = seller.id;
    buyerToken = generateBuyerToken(buyerId);
    sellerToken = generateSellerToken(sellerId);
    productId = product.id;

    const order = await createTestOrder({
      buyerId,
      status: OrderStatus.WaitingPayment,
      orderItems: [createOrderItemMock({ productId })],
    });
    orderId = order.id;
    subtotal = order.subtotal;
    usePoint = order.usePoint;
    method = PaymentMethod.card;
    provider = PaymentProvider.kakaopay;
  });

  describe('POST /api/payment', () => {
    beforeEach(async () => {});
    it('201: 결제 생성에 성공하면 생성된 결제 정보를 반환한다', async () => {
      // given
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          response: {
            access_token: 'test-portone-token',
          },
        },
      });

      mockAxiosGet.mockResolvedValueOnce({
        data: {
          response: {
            status: 'paid',
            merchant_uid: orderId,
            imp_uid: 'imp_123456',
            amount: subtotal - usePoint,
          },
        },
      });
      const requestBody = createPaymentServiceInputMock({
        orderId,
        method,
        provider,
      });

      // when
      const { statusCode, body } = await authRequest(buyerToken)
        .post('/api/payment')
        .send(requestBody);

      // then
      expect(statusCode).toBe(201);
      expect(body.price).toBe(subtotal - usePoint);
    });
    it('401: 인증되지 않은 사용자는 결제 할 수 없다.', async () => {
      // when
      const { statusCode } = await testClient.post('/api/payment').send({});

      // then
      expect(statusCode).toBe(401);
    });
    it('403: 판매자는 결제 할 수 없다.', async () => {
      // when
      const { statusCode } = await authRequest(sellerToken).post('/api/payment').send({});

      // then
      expect(statusCode).toBe(403);
    });
  });

  describe('POST /api/payment/callback', () => {
    it('200, 유효한 웹훅 요청 시 성공 메시지를 반환한다', async () => {
      // given
      const requestBody: PaymentCallbackBody = {
        imp_uid: 'impUid-id-1',
        merchant_uid: orderId, // cuid 형식 따라야함
        // 실제로 mechant_uid에 사용하는 paymentid가 아니어도 됨
        // metchant_uid가 실제 paymentId인지는 서비스에서 검증
      };

      // when
      const { statusCode, body } = await authRequest(buyerToken)
        .post('/api/payment/webhooks/portone')
        .send(requestBody);

      // then
      // 웹훅 서버 조기응답용
      expect(statusCode).toBe(200);
      expect(body).toBe('OK');
    });
  });
});
