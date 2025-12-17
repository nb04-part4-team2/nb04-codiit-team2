import type { Notification } from '@prisma/client';

// ID
export const userId = 'user-id-1';
export const notificationId = 'notification-id-1';

// ============================================
// 목 데이터 팩토리 함수
// ============================================

// 알림 생성
export const createNotificationMock = (overrides: Partial<Notification> = {}): Notification => ({
  id: notificationId,
  content: '알림 내용',
  isChecked: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: userId,
  ...overrides,
});

// ============================================
// Repository 목 데이터
// ============================================

// 사용자 모든 알림 조회
export const mockNotifications = [
  {
    ...createNotificationMock({
      id: 'notification-1',
    }),
  },
  {
    ...createNotificationMock({
      id: 'notification-2',
    }),
  },
];

// 알림 찾기
export const mockFindNotification = createNotificationMock();
