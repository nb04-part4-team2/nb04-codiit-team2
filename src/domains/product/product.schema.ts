import { z } from 'zod';

export const createProductSchema = z
  .object({
    name: z.string().min(1, '상품 이름은 필수입니다.').max(100),
    price: z.number().min(0, '가격은 0원 이상이어야 합니다.'),
    content: z.string().min(1, '상세 설명은 필수입니다.'),
    image: z.string().url('유효한 이미지 URL이 아닙니다.'),

    discountRate: z.number().min(0).max(100).default(0),

    discountStartTime: z.string().datetime().nullish(),
    discountEndTime: z.string().datetime().nullish(),

    categoryName: z.string().min(1),

    stocks: z
      .array(
        z.object({
          sizeId: z.number().int().positive('유효하지 않은 사이즈 ID입니다.'),
          quantity: z.number().int().positive('재고 수량은 1개 이상이어야 합니다.'),
        }),
      )
      .min(1, '최소 1개 이상의 재고 옵션이 필요합니다.'),
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

export const productDetailSchema = z.object({
  productId: z.string().cuid('유효한 상품 ID 형식이 아닙니다.'),
});

export const updateProductSchema = z
  .object({
    id: z.string().cuid('유효한 상품 ID 형식이 아닙니다.'),
    name: z.string().min(1).max(100).optional(),
    price: z.number().min(0).optional(),
    content: z.string().min(1).optional(),
    image: z.string().url().optional(),
    discountRate: z.number().min(0).max(100).optional(),
    discountStartTime: z.string().datetime().nullish(),
    discountEndTime: z.string().datetime().nullish(),
    categoryName: z.string().min(1).optional(),
    isSoldOut: z.boolean().optional(),
    stocks: z
      .array(
        z.object({
          sizeId: z.number().int().positive(),
          quantity: z.number().int().nonnegative(),
        }),
      )
      .min(1, '최소 1개 이상의 재고 옵션이 필요합니다.'),
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

export const deleteProductSchema = z.object({
  productId: z.string().cuid('유효한 상품 ID 형식이 아닙니다.'),
});
