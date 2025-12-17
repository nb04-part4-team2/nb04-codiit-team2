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

// ============================================
// Repository base
// ============================================

// 알림
const notificationBaseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  content: z.string(),
  isChecked: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================
// Repository
// ============================================

// 사용자의 모든 알림 조회
export const getNotificationsRepository = notificationBaseSchema;

export type GetNotificationsRepository = z.infer<typeof getNotificationsRepository>;

// 알림 수정 (읽음 처리)
export const updateNotificationRepository = notificationBaseSchema;

export type UpdateNotificationRepository = z.infer<typeof updateNotificationRepository>;

// ============================================
// Response
// ============================================

// 날짜 변환
const dateToISOString = z.date().transform((date) => date.toISOString());

// 사용자의 모든 알림 조회
export const getNotificationsResponse = notificationBaseSchema.extend({
  createdAt: dateToISOString,
  updatedAt: dateToISOString,
});

export type GetNotificationsResponse = z.infer<typeof getNotificationsResponse>;

// 알림 수정 (읽음 처리)
export const updateNotificationResponse = notificationBaseSchema.extend({
  createdAt: dateToISOString,
  updatedAt: dateToISOString,
});

export type UpdateNotificationResponse = z.infer<typeof updateNotificationResponse>;
