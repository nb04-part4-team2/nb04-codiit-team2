import type {
  GetNotificationsRepository,
  GetNotificationsResponse,
  UpdateNotificationRepository,
  UpdateNotificationResponse,
} from './notification.dto.js';
import { getNotificationsSchema, updateNotificationResponse } from './notification.dto.js';

// 사용자 모든 알림 조회
export const toGetNotifications = ({
  list: notifications,
  totalCount,
}: {
  list: GetNotificationsRepository[];
  totalCount: number;
}): GetNotificationsResponse => ({
  list: notifications.map((item) => getNotificationsSchema.parse(item)),
  totalCount: totalCount,
});

// 알림 수정 (읽음 처리)
export const toUpdateNotification = (
  notification: UpdateNotificationRepository,
): UpdateNotificationResponse => {
  return updateNotificationResponse.parse(notification);
};
