import { jest } from '@jest/globals';
import { NotificationRepository } from '../../src/domains/notification/notification.repository.js';
import { NotificationService } from '../../src/domains/notification/notification.service.js';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { userId } from '../mocks/notification.mock.js';
import { createNotificationMock, mockNotifications } from '../mocks/notification.mock.js';

describe('NotificationService 유닛 테스트', () => {
  let notificationService: NotificationService;
  let notificationRepository: DeepMockProxy<NotificationRepository>;

  // 테스트 케이스가 실행되기 전에 매번 실행
  beforeEach(() => {
    // 의존성 주입
    notificationRepository = mockDeep<NotificationRepository>();
    notificationService = new NotificationService(notificationRepository);
  });

  // 각 테스트가 끝난 후 모든 모의(mock)를 원래대로 복원
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  // 사용자의 모든 알림 조회
  describe('getNotifications', () => {
    it('사용자의 모든 알림 조회 성공', async () => {
      // --- 준비 (Arrange) ---
      notificationRepository.getNotifications.mockResolvedValue(mockNotifications);

      // --- 실행 (Act) ---
      const result = await notificationService.getNotifications(userId);

      const getQuery = {
        where: { userId },
        orderBy: {
          createdAt: 'desc',
        },
      };

      // --- 검증 (Assert) ---
      expect(notificationRepository.getNotifications).toHaveBeenCalledTimes(1);
      expect(notificationRepository.getNotifications).toHaveBeenCalledWith(getQuery);
      expect(result).toEqual(mockNotifications);
    });
  });

  // 알림 생성
  describe('createNotification', () => {
    it('알림 생성 성공', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        userId,
        content: '알림 내용',
      };
      const mockNotifications = createNotificationMock(data);
      notificationRepository.createNotification.mockResolvedValue(mockNotifications);

      // --- 실행 (Act) ---
      const result = await notificationService.createNotification(data);

      const createData = {
        user: {
          connect: {
            id: data.userId,
          },
        },
        content: data.content,
      };

      // --- 검증 (Assert) ---
      expect(notificationRepository.createNotification).toHaveBeenCalledTimes(1);
      expect(notificationRepository.createNotification).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockNotifications);
    });
  });
});
