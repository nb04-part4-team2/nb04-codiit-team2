import { PaymentStatus, PrismaClient } from '@prisma/client';
import {
  CreatePaymentRepoInput,
  CreatePaymentRepoOutput,
  FailedInfoRepoInput,
  GetOrderInfoOutput,
  UpdateDataRepoInput,
} from '@/domains/payment/payment.dto.js';

export class PaymentRepository {
  constructor(private prisma: PrismaClient) {}
  async getOrderInfo(orderId: string): Promise<GetOrderInfoOutput | null> {
    return await this.prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        status: true,
        subtotal: true,
        usePoint: true,
      },
    });
  }
  async getPaymentPrice(paymentId: string) {
    return await this.prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      select: {
        price: true,
      },
    });
  }
  async updateFailed(paymentId: string, failedInfo: FailedInfoRepoInput) {
    return await this.prisma.payment.updateMany({
      where: {
        id: paymentId,
        status: PaymentStatus.pending,
        impUid: null, // 정상 처리 중인 결제도 실패 처리될 위험 방지
      },
      data: {
        status: PaymentStatus.failed,
        errorCode: failedInfo.errorCode,
        errorMessage: failedInfo.errorMessage,
        failedAt: failedInfo.failedAt,
      },
    });
  }
  async createPayment(data: CreatePaymentRepoInput): Promise<CreatePaymentRepoOutput> {
    return await this.prisma.payment.create({
      data: {
        price: data.price,
        impUid: null,
        provider: data.provider,
        method: data.method,
        status: PaymentStatus.pending,
        order: {
          connect: {
            id: data.orderId,
          },
        },
      },
      select: {
        // 주문 초기 생성 시점에 프론트에서 필요한 데이터만 select
        id: true,
        price: true,
        createdAt: true,
      },
    });
  }
  async updatePayment(updateData: UpdateDataRepoInput) {
    return await this.prisma.payment.updateMany({
      where: {
        id: updateData.merchantUid,
        status: PaymentStatus.pending,
      },
      data: {
        impUid: updateData.impUid,
        price: updateData.amount,
        status: updateData.status,
        provider: updateData.provider,
        method: updateData.method,
        pgTid: updateData.pgTid,
        approvedAt: updateData.paidAt,
      },
    });
  }
}
