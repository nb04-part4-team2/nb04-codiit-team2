// 주문 생성 실제 프론트 페이로드 (swagger랑 동일함)
// {
//     "name":"테스트",
//     "phone":"0101234-1234",
//     "address":"전북전주시~~~ 101동101호",
//     "usePoint":0,
//     "orderItems": [
//         {
//             "productId":"cmc1i97y10055iup6srpu0ht9",
//             "sizeId":1,
//             "quantity":1
//         }
//     ]
// }
// 주문 생성 실제 백엔드 리스폰스
// swagger랑 너무 다름, 프론트 코드에서 보면 product나 연관 데이터 없는 기본 order 타입같아 보임
// 일단 swagger 대로 구현 하고 로컬에서 연결되면 테스트
// {
//     "id": "cmj2i3w880007lg04zovm4g3u",
//     "userId": "cmimny4n20000jp048jbtbf1f",
//     "name": "테스트",
//     "phoneNumber": "0101234-5678",
//     "address": "서울 우리집",
//     "subtotal": 31400,
//     "totalQuantity": 1,
//     "usePoint": 0,
//     "createdAt": "2025-12-12T06:43:41.672Z",
//     "updatedAt": "2025-12-12T06:43:41.672Z"
// }
import * as z from 'zod';

export const createOrderItemSchema = z.object({
  productId: z.cuid(),
  sizeId: z.number(),
  quantity: z.number(),
});

export const createOrderSchema = z.object({
  name: z.string(),
  phone: z.string().max(13),
  address: z.string(),
  usePoint: z.number(),
  orderItems: z.array(createOrderItemSchema),
});

export type CreateOrderBody = z.infer<typeof createOrderSchema>;
export type CreateOrderItemBody = z.infer<typeof createOrderItemSchema>;
