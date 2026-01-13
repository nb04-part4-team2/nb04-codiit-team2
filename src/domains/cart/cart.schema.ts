import * as z from 'zod';

export const cartItemIdParamSchema = z
  .object({
    cartItemId: z.cuid('유효한 아이템 ID를 입력하세요.'),
  })
  .strict();

export const updateCartSchema = z
  .object({
    productId: z.cuid({ message: '올바르지 않은 productId 형식입니다.' }),
    sizes: z
      .array(
        z.object({
          sizeId: z.number().int().min(1).max(6), // 사이즈 스키마 참고
          quantity: z.number().int().min(1, '수량은 1개 이상이어야 합니다.'),
        }),
      )
      .nonempty('최소 하나의 옵션을 선택해야 합니다.')
      .refine(
        (items) => {
          const sizeIds = items.map((item) => item.sizeId);
          return new Set(sizeIds).size === sizeIds.length;
        },
        { message: '중복된 사이즈 옵션이 존재합니다.' },
      ),
  })
  .strict();

export type UpdateCartBody = z.infer<typeof updateCartSchema>;
