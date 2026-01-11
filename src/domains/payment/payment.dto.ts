import { OrderStatus, PaymentMethod, PaymentProvider, PaymentStatus } from '@prisma/client';
import { CreatePaymentOutPutBase } from '@/domains/payment/payment.type.js';
import { CreatePaymentBody } from '@/domains/payment/payment.schema.js';

// 결제 생성 관련 dto
export type CreatePaymentServiceInput = CreatePaymentBody;

export interface GetOrderInfoOutput {
  status: OrderStatus;
  subtotal: number;
  usePoint: number;
}

export interface CreatePaymentRepoInput extends CreatePaymentServiceInput {
  price: number;
}

export type CreatePaymentRepoOutput = CreatePaymentOutPutBase<Date>;
export type CreatePaymentResponse = CreatePaymentOutPutBase<string>;

// 결제 확정 관련 dto
export interface FailedInfoRepoInput {
  errorCode: string;
  errorMessage: string;
  failedAt: Date;
}

export interface UpdateDataRepoInput {
  merchantUid: string;
  impUid: string;
  amount: number;
  status: PaymentStatus;
  provider: PaymentProvider;
  method: PaymentMethod;
  pgTid: string;
  paidAt: Date;
}

export interface GetPortonePaymentInfo {
  merchant_uid: string;
  imp_uid: string;
  status: string;
  amount: number;
  pg_provider: string;
  pay_method: string;
  pg_tid: string;
  paid_at: number;
}
