import { z } from 'zod';

// ============================================
// Request
// ============================================

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
    page: z.coerce.number().min(1).max(100).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(100),
    status: z.enum(['WaitingAnswer', 'CompletedAnswer']).optional(),
  })
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

// ============================================
// Repository base
// ============================================

// 사용자
const userBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
});

// 사용자 축소
const userOmit = userBaseSchema.omit({
  id: true,
});

// 문의
const inquiryBaseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  productId: z.string(),
  title: z.string(),
  content: z.string(),
  status: z.enum(['WaitingAnswer', 'CompletedAnswer']),
  isSecret: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 문의 축소
const inquiryOmit = inquiryBaseSchema.omit({
  userId: true,
  productId: true,
  updatedAt: true,
});

// 답변
const replyBaseSchema = z.object({
  id: z.string(),
  inquiryId: z.string(),
  userId: z.string(),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 답변 축소
const replyOmit = replyBaseSchema.omit({
  inquiryId: true,
  userId: true,
});

// 상품
const productBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
});

// 스토어
const storeBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
});

// ============================================
// Repository
// ============================================

// 특정 상품의 모든 문의 조회
export const getInquiriesRepository = inquiryBaseSchema.extend({
  user: userOmit,
  reply: replyBaseSchema
    .extend({
      user: userOmit,
    })
    .nullable(),
});

export type GetInquiriesRepository = z.infer<typeof getInquiriesRepository>;

// 문의 생성
export const createInquiryRepository = inquiryBaseSchema;

export type CreateInquiryRepository = z.infer<typeof createInquiryRepository>;

// 모든 문의 조회 (사용자 본인의 문의)
export const getAllInquiriesRepository = inquiryOmit.extend({
  user: userBaseSchema,
  product: productBaseSchema.extend({
    store: storeBaseSchema,
  }),
});

export type GetAllInquiriesRepository = z.infer<typeof getAllInquiriesRepository>;

// 특정 문의 조회
export const getInquiryByIdRepository = inquiryBaseSchema.extend({
  reply: replyOmit
    .extend({
      user: userBaseSchema,
    })
    .nullable(),
});

export type GetInquiryByIdRepository = z.infer<typeof getInquiryByIdRepository>;

// 문의 수정
export const updateInquiryRepository = inquiryBaseSchema;

export type UpdateInquiryRepository = z.infer<typeof updateInquiryRepository>;

// 문의 삭제
export const deleteInquiryRepository = inquiryBaseSchema;

export type DeleteInquiryRepository = z.infer<typeof deleteInquiryRepository>;

// 답변 생성
export const createReplyRepository = replyBaseSchema;

export type CreateReplyRepository = z.infer<typeof createReplyRepository>;

// 답변 수정
export const updateReplyRepository = replyBaseSchema;

export type UpdateReplyRepository = z.infer<typeof updateReplyRepository>;

// ============================================
// Response
// ============================================

// 날짜 변환
const dateToISOString = z.date().transform((date) => date.toISOString());

// 특정 상품의 모든 문의 조회
const getInquiriesReplySchema = replyBaseSchema.extend({
  createdAt: dateToISOString,
  updatedAt: dateToISOString,
});

export const getInquiriesSchema = inquiryBaseSchema.extend({
  user: userOmit,
  createdAt: dateToISOString,
  updatedAt: dateToISOString,
  reply: getInquiriesReplySchema.nullable(),
});

export const getInquiriesResponse = z.object({
  list: z.array(getInquiriesSchema),
  totalCount: z.number().int().min(0),
});

export type GetInquiriesResponse = z.infer<typeof getInquiriesResponse>;

// 문의 생성
export const createInquiryResponse = inquiryBaseSchema.extend({
  createdAt: dateToISOString,
  updatedAt: dateToISOString,
});

export type CreateInquiryResponse = z.infer<typeof createInquiryResponse>;

// 모든 문의 조회 (사용자 본인의 문의)
export const getAllInquiriesSchema = getAllInquiriesRepository.extend({
  createdAt: dateToISOString,
});

export const getAllInquiriesResponse = z.object({
  list: z.array(getAllInquiriesSchema),
  totalCount: z.number().int().min(0),
});

export type GetAllInquiriesResponse = z.infer<typeof getAllInquiriesResponse>;

// 특정 문의 조회
const getInquiryByIdReplySchema = replyOmit.extend({
  createdAt: dateToISOString,
  updatedAt: dateToISOString,
  user: userBaseSchema,
});

export const getInquiryByIdResponse = inquiryBaseSchema.extend({
  createdAt: dateToISOString,
  updatedAt: dateToISOString,
  reply: getInquiryByIdReplySchema.nullable(),
});

export type GetInquiryByIdResponse = z.infer<typeof getInquiryByIdResponse>;

// 문의 수정
export const updateInquiryResponse = inquiryBaseSchema.extend({
  createdAt: dateToISOString,
  updatedAt: dateToISOString,
});

export type UpdateInquiryResponse = z.infer<typeof updateInquiryResponse>;

// 문의 삭제
export const deleteInquiryResponse = inquiryBaseSchema.extend({
  createdAt: dateToISOString,
  updatedAt: dateToISOString,
});

export type DeleteInquiryResponse = z.infer<typeof deleteInquiryResponse>;

// 답변 생성
export const createReplyResponse = replyBaseSchema.extend({
  createdAt: dateToISOString,
  updatedAt: dateToISOString,
});

export type CreateReplyResponse = z.infer<typeof createReplyResponse>;

// 답변 수정
export const updateReplyResponse = replyBaseSchema.extend({
  createdAt: dateToISOString,
  updatedAt: dateToISOString,
});

export type UpdateReplyResponse = z.infer<typeof updateReplyResponse>;
