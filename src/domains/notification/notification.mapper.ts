import type {
  GetNotificationsRepository,
  GetNotificationsResponse,
  UpdateNotificationRepository,
  UpdateNotificationResponse,
} from './notification.dto.js';
import { getNotificationsResponse, updateNotificationResponse } from './notification.dto.js';

// 사용자 모든 알림 조회
export const toGetNotifications = (
  notifications: GetNotificationsRepository[],
): GetNotificationsResponse[] => {
  return notifications.map((notification) => getNotificationsResponse.parse(notification));
};

// 알림 수정 (읽음 처리)
export const toUpdateNotification = (
  notification: UpdateNotificationRepository,
): UpdateNotificationResponse => {
  return updateNotificationResponse.parse(notification);
};
