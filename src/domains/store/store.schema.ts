import { z } from 'zod';

// ============================================
// Path Parameters
// ============================================

export const storeIdParamSchema = z
  .object({
    storeId: z.string().cuid('유효한 스토어 ID를 입력하세요.'),
  })
  .strict();

export type StoreIdParam = z.infer<typeof storeIdParamSchema>;

// ============================================
// Query Parameters
// ============================================

export const storeProductQuerySchema = z
  .object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(10),
  })
  .partial()
  .strict();

export type StoreProductQuery = z.infer<typeof storeProductQuerySchema>;

// ============================================
// Store Base Schema (SSOT - 단일 진실 공급원)
// ============================================

const storeBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '스토어 이름을 입력하세요.')
    .max(100, '스토어 이름은 최대 100자까지 가능합니다.'),
  address: z.string().trim().min(1, '주소를 입력하세요.'),
  detailAddress: z.string().trim().min(1, '상세 주소를 입력하세요.').optional(),
  phoneNumber: z
    .string()
    .min(1, '전화번호를 입력하세요.')
    .regex(
      /^(0\d{1,2}-?\d{3,4}-?\d{4}|1\d{3}-?\d{4})$/,
      '유효한 전화번호를 입력하세요. (예: 010-1234-5678)',
    ),
  content: z
    .string()
    .trim()
    .min(10, '스토어 소개는 최소 10자 이상 입력하세요.')
    .max(300, '스토어 소개는 최대 300자까지 가능합니다.'),
  image: z.string().optional(),
});

// ============================================
// Request Body - Create Store
// ============================================

export const createStoreSchema = storeBaseSchema.strict();

export type CreateStoreBody = z.infer<typeof createStoreSchema>;

// ============================================
// Request Body - Update Store
// ============================================

export const updateStoreSchema = storeBaseSchema
  .extend({
    image: z.string().nullable().optional(),
  })
  .partial()
  .strict();

export type UpdateStoreBody = z.infer<typeof updateStoreSchema>;
