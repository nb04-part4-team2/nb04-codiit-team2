import { z } from 'zod';

// params
export const idSchema = z
  .object({
    id: z.cuid('유효한 ID를 입력하세요.'),
  })
  .strict();

export type IdParam = z.infer<typeof idSchema>;

export const productIdSchema = z
  .object({
    productId: z.cuid('유효한 ID를 입력하세요.'),
  })
  .strict();

export type ProductIdParam = z.infer<typeof productIdSchema>;

// query
export const offsetSchema = z
  .object({
    page: z.string().min(1).max(100).default('1'),
    pageSize: z.string().min(100).max(100).default('100'),
    status: z.enum(['WaitingAnswer', 'CompletedAnswer']),
  })
  .partial()
  .strict();

export type OffsetQuery = z.infer<typeof offsetSchema>;

// body
export const titleSchema = z
  .string()
  .min(1, '제목은 최소 1글자 이상이어야 합니다.')
  .max(100, '제목은 최대 100글자까지 가능합니다.');
export const contentSchema = z
  .string()
  .min(1, '내용은 최소 1글자 이상이어야 합니다.')
  .max(1000, '내용은 최대 1000글자까지 가능합니다.');
export const isSecretSchema = z.boolean().default(false);

// 문의 생성
export const createInquiry = z
  .object({
    title: titleSchema,
    content: contentSchema,
    isSecret: isSecretSchema,
  })
  .strict();

export type CreateInquiryBody = z.infer<typeof createInquiry>;

// 문의 수정
export const updateInquiry = z
  .object({
    title: titleSchema,
    content: contentSchema,
    isSecret: isSecretSchema,
  })
  .partial()
  .strict();

export type UpdateInquiryBody = z.infer<typeof updateInquiry>;

// 답변 생성
export const createReply = z
  .object({
    content: contentSchema,
  })
  .strict();

export type CreateReplyBody = z.infer<typeof createReply>;

// 답변 수정
export const updateReply = z
  .object({
    content: contentSchema,
  })
  .partial()
  .strict();

export type UpdateReplyBody = z.infer<typeof updateReply>;
