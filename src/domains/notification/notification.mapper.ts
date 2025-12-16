import type { GetNotificationsRepository, GetNotificationsResponse } from './notification.dto.js';
import { getNotificationsResponse } from './notification.dto.js';

// 사용자 모든 알림 조회
export const toGetNotifications = (
  notifications: GetNotificationsRepository[],
): GetNotificationsResponse[] => {
  return notifications.map((notification) => getNotificationsResponse.parse(notification));
};
