import { OrderStatus } from '@prisma/client';
import * as z from 'zod';

export const createOrderItemSchema = z.object({
  productId: z.cuid(),
  sizeId: z.number(),
  quantity: z.number().int().min(1),
});

export const orderSchema = z.object({
  name: z.string().min(1, '이름을 입력해야 합니다.'),
  phone: z.string().max(13),
  address: z.string().min(1, '주소를 입력해야 합니다.'),
});

export const createOrderSchema = orderSchema.extend({
  usePoint: z.number().min(0),
  orderItems: z.array(createOrderItemSchema).min(1, '최소 한 개 이상의 상품이 있어야 합니다.'),
});

export const orderIdParamSchema = z
  .object({
    orderId: z.cuid('유효한 주문 ID를 입력하세요.'),
  })
  .strict();

export const orderQuerySchema = z.object({
  status: z.enum(OrderStatus),
  limit: z.coerce.number().int().min(1).max(100).default(3), // 기본값은 swagger 참고
  page: z.coerce.number().int().min(1).default(1),
});

export type CreateOrderBody = z.infer<typeof createOrderSchema>;
export type CreateOrderItemBody = z.infer<typeof createOrderItemSchema>;
export type UpdateOrderBody = z.infer<typeof orderSchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
