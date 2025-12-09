import { z } from 'zod';

export const createProductSchema = z
  .object({
    name: z.string().min(1, '상품 이름은 필수입니다.').max(100),
    price: z.number().min(0, '가격은 0원 이상이어야 합니다.'),
    content: z.string().min(1, '상세 설명은 필수입니다.'),
    image: z.string().url('유효한 이미지 URL이 아닙니다.'),
    discountRate: z.number().min(0).max(100),
    discountStartTime: z.string().datetime().nullish(),
    discountEndTime: z.string().datetime().nullish(),
    categoryName: z.string().min(1),
    stocks: z
      .array(
        z.object({
          sizeId: z.number(),
          quantity: z.number().min(0),
        }),
      )
      .min(1, '최소 1개 이상의 재고가 필요합니다.'),
  })
  .refine(
    (data) => {
      if (data.discountStartTime && data.discountEndTime) {
        return new Date(data.discountStartTime) < new Date(data.discountEndTime);
      }
      return true;
    },
    {
      message: '할인 종료일은 시작일보다 뒤여야 합니다.',
      path: ['discountEndTime'],
    },
  );
