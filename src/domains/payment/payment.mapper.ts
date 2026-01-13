import { CreatePaymentRepoOutput, CreatePaymentResponse } from './payment.dto.js';

export const toPaymentResponse = (payment: CreatePaymentRepoOutput): CreatePaymentResponse => ({
  id: payment.id,
  price: payment.price,
  createdAt: payment.createdAt.toISOString(),
});
