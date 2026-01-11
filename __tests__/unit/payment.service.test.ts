import { beforeEach, describe, it, jest } from '@jest/globals';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PaymentRepository } from '@/domains/payment/payment.repository.js';
import { OrderService } from '@/domains/order/order.service.js';
import {
  createFailedInfoMock,
  createGetPortonePaymentInfoMock,
  createOrderInfoOutputMock,
  createPaymentServiceInputMock,
  createUpdatePaymentRepoInputMock,
} from '../mocks/payment.mock.js';
import { OrderStatus } from '@prisma/client';
import { BadRequestError, NotFoundError } from '@/common/utils/errors.js';
import type { PaymentService } from '@/domains/payment/payment.service.js';

const mockAxiosPost = jest.fn<(config?: unknown) => Promise<unknown>>();
const mockAxiosGet = jest.fn<(config?: unknown) => Promise<unknown>>();

jest.unstable_mockModule('axios', () => ({
  __esModule: true,
  default: { post: mockAxiosPost, get: mockAxiosGet },
  isAxiosError: jest.fn(),
}));

describe('PaymentService', () => {
  let mockPaymentService: PaymentService;
  let mockPaymentRepo: DeepMockProxy<PaymentRepository>;
  let mockOrderService: DeepMockProxy<OrderService>;

  beforeEach(async () => {
    jest.resetAllMocks();

    const { PaymentService } = await import('@/domains/payment/payment.service.js');
    mockPaymentRepo = mockDeep<PaymentRepository>();
    mockOrderService = mockDeep<OrderService>();
    mockPaymentService = new PaymentService(mockPaymentRepo, mockOrderService);
  });

  describe('결제 생성', () => {
    it('결제 생성 성공', async () => {
      // given
      const input = createPaymentServiceInputMock();
      const orderInfo = createOrderInfoOutputMock();
      const expectedPrice = orderInfo.subtotal - orderInfo.usePoint;

      mockPaymentRepo.getOrderInfo.mockResolvedValue(orderInfo);
      mockPaymentRepo.createPayment.mockResolvedValue({
        id: 'payment-id-1',
        price: expectedPrice,
        createdAt: new Date(),
      });

      // when
      const result = await mockPaymentService.createPayment(input);

      // then
      expect(mockPaymentRepo.getOrderInfo).toHaveBeenCalledWith(input.orderId);
      expect(mockPaymentRepo.createPayment).toHaveBeenCalledWith({
        ...input,
        price: expectedPrice,
      });
      expect(result.price).toBe(expectedPrice);
    });

    it('결제 생성 실패 (주문 조회에 실패하면 NotFoundError 발생)', async () => {
      // given
      const input = createPaymentServiceInputMock();
      mockPaymentRepo.getOrderInfo.mockResolvedValue(null);

      // when
      // then
      await expect(mockPaymentService.createPayment(input)).rejects.toThrow(NotFoundError);
    });

    it('결제 생성 실패 (이미 결제 완료된 주문 요청이 오면 BadRequestError 발생)', async () => {
      // given
      const input = createPaymentServiceInputMock();
      const orderInfo = createOrderInfoOutputMock({ status: OrderStatus.CompletedPayment });
      mockPaymentRepo.getOrderInfo.mockResolvedValue(orderInfo);

      // when
      // then
      await expect(mockPaymentService.createPayment(input)).rejects.toThrow(BadRequestError);
    });
  });
  describe('결제 확정 처리 웹훅', () => {
    let imp_uid: string;
    let merchant_uid: string;
    beforeEach(() => {
      imp_uid = 'impUid-id-1';
      merchant_uid = 'payment-id-1';
      mockAxiosPost.mockResolvedValue({
        data: { response: { access_token: 'test_token' } },
      });
    });
    it('결제 검증 유효 (결제 확정)', async () => {
      // given
      const updatePaymentInput = createUpdatePaymentRepoInputMock();

      mockAxiosGet.mockResolvedValue({
        data: {
          response: createGetPortonePaymentInfoMock(),
        },
      });
      mockPaymentRepo.updatePayment.mockResolvedValue({
        count: 1,
      });
      mockPaymentRepo.getPaymentPrice.mockResolvedValue({
        price: 10000,
      });

      // when
      await mockPaymentService.paymentCallback(imp_uid, merchant_uid);

      // then
      // 결제 실패시 호출되는 레포 함수 미호출 검증
      expect(mockPaymentRepo.updateFailed).not.toHaveBeenCalled();

      // 결제 확정 함수 호출 검증
      expect(mockPaymentRepo.updatePayment).toHaveBeenCalledTimes(1);
      expect(mockPaymentRepo.updatePayment).toHaveBeenCalledWith(updatePaymentInput);

      // 결제 금액 조회 호출 검증
      expect(mockPaymentRepo.getPaymentPrice).toHaveBeenCalledWith(merchant_uid);

      // 주문 확정처리 함수 호출 검증
      expect(mockOrderService.confirmPayment).toHaveBeenCalledTimes(1);
      expect(mockOrderService.confirmPayment).toHaveBeenCalledWith('payment-id-1');
    });
    it('결제 검증 에러 (결제 미완료 상태인 경우 즉시 종료 - 중복 호출 방어)', async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          response: createGetPortonePaymentInfoMock({
            status: 'ready',
          }),
        },
      });
      // when
      await mockPaymentService.paymentCallback(imp_uid, merchant_uid);

      // then
      expect(mockPaymentRepo.updateFailed).not.toHaveBeenCalled();
      expect(mockPaymentRepo.getPaymentPrice).not.toHaveBeenCalled();
      expect(mockPaymentRepo.updatePayment).not.toHaveBeenCalled();
      expect(mockOrderService.confirmPayment).not.toHaveBeenCalled();
    });
    it('결제 검증 에러 (결제 실패 상태인 경우 결제 상태 업데이트 후 즉시 종료)', async () => {
      const failedInfo = createFailedInfoMock();
      mockAxiosGet.mockResolvedValue({
        data: {
          response: {
            status: 'failed',
            fail_reason: failedInfo.errorMessage,
            failed_at: 1767792521,
          },
        },
      });
      // when
      await mockPaymentService.paymentCallback(imp_uid, merchant_uid);

      // then
      expect(mockPaymentRepo.updateFailed).toHaveBeenCalledWith(merchant_uid, failedInfo);
      expect(mockPaymentRepo.getPaymentPrice).not.toHaveBeenCalled();
      expect(mockPaymentRepo.updatePayment).not.toHaveBeenCalled();
      expect(mockOrderService.confirmPayment).not.toHaveBeenCalled();
    });
    it('결제 검증 에러 (결제가 비정상 상태인 경우 즉시 종료)', async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          response: createGetPortonePaymentInfoMock({
            status: 'error',
          }),
        },
      });
      // when
      await mockPaymentService.paymentCallback(imp_uid, merchant_uid);

      // then
      expect(mockPaymentRepo.updateFailed).not.toHaveBeenCalled();
      expect(mockPaymentRepo.getPaymentPrice).not.toHaveBeenCalled();
      expect(mockPaymentRepo.updatePayment).not.toHaveBeenCalled();
      expect(mockOrderService.confirmPayment).not.toHaveBeenCalled();
    });
    it('결제 검증 에러 (결제 id가 불일치한 경우 즉시 종료)', async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          response: createGetPortonePaymentInfoMock({
            merchant_uid: 'error',
          }),
        },
      });
      // when
      await mockPaymentService.paymentCallback(imp_uid, merchant_uid);

      // then
      expect(mockPaymentRepo.updateFailed).toHaveBeenCalled();
      expect(mockPaymentRepo.getPaymentPrice).not.toHaveBeenCalled();
      expect(mockPaymentRepo.updatePayment).not.toHaveBeenCalled();
      expect(mockOrderService.confirmPayment).not.toHaveBeenCalled();
    });
    it('결제 검증 에러 (결제 금액이 불일치한 경우 즉시 종료)', async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          response: createGetPortonePaymentInfoMock({
            amount: 9999999,
          }),
        },
      });
      mockPaymentRepo.getPaymentPrice.mockResolvedValue({
        price: 10000,
      });
      // when
      await mockPaymentService.paymentCallback(imp_uid, merchant_uid);

      // then
      expect(mockPaymentRepo.updateFailed).toHaveBeenCalled();
      expect(mockPaymentRepo.getPaymentPrice).toHaveBeenCalled();
      expect(mockPaymentRepo.getPaymentPrice).toHaveBeenCalledWith(merchant_uid);
      expect(mockPaymentRepo.updatePayment).not.toHaveBeenCalled();
      expect(mockOrderService.confirmPayment).not.toHaveBeenCalled();
    });
    it('결제 검증 에러 (결제 검증 통과 후 결제가 pending 상태가 아닌 경우 즉시 종료 - 중복 호출 방어 로직)', async () => {
      // given
      const updatePaymentInput = createUpdatePaymentRepoInputMock();

      mockAxiosGet.mockResolvedValue({
        data: {
          response: createGetPortonePaymentInfoMock(),
        },
      });
      mockPaymentRepo.updatePayment.mockResolvedValue({
        count: 0,
      });
      mockPaymentRepo.getPaymentPrice.mockResolvedValue({
        price: 10000,
      });

      // when
      await mockPaymentService.paymentCallback(imp_uid, merchant_uid);

      // then
      // 결제 실패시 호출되는 레포 함수 미호출 검증
      expect(mockPaymentRepo.updateFailed).not.toHaveBeenCalled();

      // 결제 확정 함수 호출 검증
      expect(mockPaymentRepo.updatePayment).toHaveBeenCalledTimes(1);
      expect(mockPaymentRepo.updatePayment).toHaveBeenCalledWith(updatePaymentInput);

      // 결제 금액 조회 호출 검증
      expect(mockPaymentRepo.getPaymentPrice).toHaveBeenCalledWith(merchant_uid);

      // 주문 확정처리 함수 미호출 검증
      expect(mockOrderService.confirmPayment).not.toHaveBeenCalled();
    });
  });
});
