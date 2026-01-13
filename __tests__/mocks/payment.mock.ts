import { OrderStatus, PaymentMethod, PaymentProvider, PaymentStatus } from '@prisma/client';
import {
  CreatePaymentRepoInput,
  CreatePaymentRepoOutput,
  CreatePaymentServiceInput,
  FailedInfoRepoInput,
  GetOrderInfoOutput,
  GetPortonePaymentInfo,
  UpdateDataRepoInput,
} from '@/domains/payment/payment.dto.js';

// ============================================
// Base Mocks
// ============================================
const date1 = new Date('2025-12-04T05:05:00.861Z');

export const baseInputMock = {
  orderId: 'order-id-1',
  method: PaymentMethod.card,
  provider: PaymentProvider.kakaopay,
};

export const baseOrderInfoOutputMock = {
  status: OrderStatus.WaitingPayment,
  subtotal: 10000,
  usePoint: 0,
};

export const basePaymentRepoOutputMock = {
  id: 'payment-id-1',
  price: 10000,
  createdAt: date1,
};

export const basePortonePaymentInfoMock = {
  merchant_uid: 'payment-id-1',
  status: 'paid',
  amount: 10000,
  imp_uid: 'impUid-id-1',
  pg_provider: PaymentProvider.kakaopay,
  pay_method: PaymentMethod.card,
  pg_tid: 'Ttest-id-1',
  paid_at: 1767792521, // 실제 결과 참고
};

export const baseUpdatePaymentInputMock = {
  merchantUid: basePortonePaymentInfoMock.merchant_uid,
  impUid: basePortonePaymentInfoMock.imp_uid,
  amount: basePortonePaymentInfoMock.amount,
  status: PaymentStatus.paid,
  provider: PaymentProvider.kakaopay,
  method: PaymentMethod.card,
  pgTid: basePortonePaymentInfoMock.pg_tid,
  paidAt: new Date(basePortonePaymentInfoMock.paid_at * 1000),
};

export const baseFailedInfoMock = {
  errorCode: '400',
  errorMessage: '결제 금액 부족',
  failedAt: new Date(basePortonePaymentInfoMock.paid_at * 1000),
};
// ============================================
// 목 팩토리
// ============================================
// 결제 생성 관련
export const createPaymentServiceInputMock = (
  overrides: Partial<CreatePaymentServiceInput> = {},
): CreatePaymentServiceInput => ({
  ...baseInputMock,
  ...overrides,
});

export const createOrderInfoOutputMock = (
  overrides: Partial<GetOrderInfoOutput> = {},
): GetOrderInfoOutput => ({
  ...baseOrderInfoOutputMock,
  ...overrides,
});

export const createPaymentRepoInputMock = (
  overrides: Partial<CreatePaymentRepoInput> = {},
): CreatePaymentRepoInput => {
  const { price, ...rest } = overrides;
  return {
    price: price ?? 10000,
    ...createPaymentServiceInputMock(rest),
  };
};

export const createPaymentRepoOutputMock = (
  overrides: Partial<CreatePaymentRepoOutput> = {},
): CreatePaymentRepoOutput => ({
  ...basePaymentRepoOutputMock,
  ...overrides,
});

// 결제 확정 처리 관련
export const createGetPortonePaymentInfoMock = (
  overrides: Partial<GetPortonePaymentInfo> = {},
): GetPortonePaymentInfo => ({
  ...basePortonePaymentInfoMock,
  ...overrides,
});

export const createUpdatePaymentRepoInputMock = (
  overrides: Partial<UpdateDataRepoInput> = {},
): UpdateDataRepoInput => ({
  ...baseUpdatePaymentInputMock,
  ...overrides,
});

export const createFailedInfoMock = (
  overrides: Partial<FailedInfoRepoInput> = {},
): FailedInfoRepoInput => ({
  ...baseFailedInfoMock,
  ...overrides,
});
