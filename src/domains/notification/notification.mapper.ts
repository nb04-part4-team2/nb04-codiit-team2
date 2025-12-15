import type { GetNotificationsRepository, GetNotificationsResponse } from './notification.dto.js';
import { getNotificationsResponse } from './notification.dto.js';

// 사용자 모든 알람 조회
export const toGetNotifications = (
  notifications: GetNotificationsRepository,
): GetNotificationsResponse => {
  return getNotificationsResponse.parse(notifications);
};
