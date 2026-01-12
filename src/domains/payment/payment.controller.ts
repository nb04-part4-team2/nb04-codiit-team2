import { Request, Response } from 'express';
import { PaymentService } from '@/domains/payment/payment.service.js';
import { toPaymentResponse } from './payment.mapper.js';

export class PaymentController {
  constructor(private paymentService: PaymentService) {}
  createPayment = async (req: Request, res: Response) => {
    const { orderId, provider, method } = req.body;
    const result = await this.paymentService.createPayment({ orderId, provider, method });
    return res.status(201).json(toPaymentResponse(result));
  };
  paymentCallback = async (req: Request, res: Response) => {
    const { imp_uid, merchant_uid } = req.body;
    res.status(200).json('OK'); // 응답을 안주면 포트원 관리자 콘솔에서 웹훅 발송 실패 처리됨
    await this.paymentService.paymentCallback(imp_uid, merchant_uid);
    // 리턴 없음
  };
}
