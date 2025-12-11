import { z } from 'zod';

export const createProductSchema = z
  .object({
    name: z.string().min(1, '상품 이름은 필수입니다.').max(100),
    price: z.number().min(0, '가격은 0원 이상이어야 합니다.'),
    content: z.string().min(1, '상세 설명은 필수입니다.'),
    image: z.string().url('유효한 이미지 URL이 아닙니다.'),

    // 할인율은 0~100 사이
    discountRate: z.number().min(0).max(100),

    // 날짜는 nullish (null 또는 undefined 허용)
    discountStartTime: z.string().datetime().nullish(),
    discountEndTime: z.string().datetime().nullish(),

    categoryName: z.string().min(1),

    stocks: z
      .array(
        z.object({
          // 사이즈 ID는 정수이면서 양수여야 함 (1, 2, 3...)
          sizeId: z.number().int().positive('유효하지 않은 사이즈 ID입니다.'),

          // 상품 등록 시 재고는 최소 1개 이상이어야 함
          quantity: z.number().int().positive('재고 수량은 1개 이상이어야 합니다.'),
        }),
      )
      .min(1, '최소 1개 이상의 재고 옵션이 필요합니다.'),
  })
  .refine(
    (data) => {
      // 할인 기간 유효성 검증
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

export const productListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).default(10),
  search: z.string().optional(),
  sort: z
    .enum([
      'mostReviewed', // 리뷰 많은순
      'recent', // 등록일순 (최신순)
      'lowPrice', // 낮은 가격순
      'highPrice', // 높은 가격순
      'highRating', // 별점 높은순
      'salesRanking', // 판매순
    ])
    .default('recent'), // 기본 정렬은 최신순으로 설정 (필요에 따라 변경 가능)
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  size: z.string().optional(), // 사이즈 이름
  favoriteStore: z.string().optional(),
  categoryName: z.string().optional(),
});
