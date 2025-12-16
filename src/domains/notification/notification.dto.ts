import { z } from 'zod';

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
