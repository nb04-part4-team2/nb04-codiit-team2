import { PaymentMethod, PaymentProvider } from '@prisma/client';
import * as z from 'zod';

export const createPaymentBody = z
  .object({
    orderId: z.cuid(),
    provider: z.enum(PaymentProvider),
    method: z.enum(PaymentMethod),
  })
  .strict();

export const PaymentCallbackBody = z.object({
  imp_uid: z.string(),
  merchant_uid: z.cuid(),
});

export type CreatePaymentBody = z.infer<typeof createPaymentBody>;
export type PaymentCallbackBody = z.infer<typeof PaymentCallbackBody>;
