import { jest } from '@jest/globals';
import type { Prisma } from '@prisma/client';
import { NotificationRepository } from '../../src/domains/notification/notification.repository.js';
import { NotificationService } from '../../src/domains/notification/notification.service.js';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { userId, createNotificationMock, mockNotifications } from '../mocks/notification.mock.js';
import { sseManager } from '../../src/common/utils/sse.manager.js';

// sse 타입 정의
type SendMessageFn = (userId: string, message: Notification) => void;

describe('NotificationService 유닛 테스트', () => {
  let notificationService: NotificationService;
  let notificationRepository: DeepMockProxy<NotificationRepository>;
  let sendMessageSpy: SendMessageFn & jest.Mock;
  const tx = mockDeep<Prisma.TransactionClient>();

  // 테스트 케이스가 실행되기 전에 매번 실행
  beforeEach(() => {
    // 의존성 주입
    notificationRepository = mockDeep<NotificationRepository>();
    notificationService = new NotificationService(notificationRepository);

    // sse 스파이
    sendMessageSpy = jest
      .spyOn(sseManager, 'sendMessage')
      .mockImplementation(() => {}) as SendMessageFn & jest.Mock;
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
    it('알림 생성 성공 (트랜잭션 없이)', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        userId,
        content: '알림 내용',
      };
      const mockNotification = createNotificationMock(data);
      notificationRepository.createNotification.mockResolvedValue(mockNotification);

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
      expect(notificationRepository.createNotification).toHaveBeenCalledWith(createData, undefined);
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(sendMessageSpy).toHaveBeenCalledWith(userId, mockNotification);
      expect(result).toEqual(mockNotification);
    });

    it('알림 생성 성공 (트랜잭션과 함께)', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        userId,
        content: '알림 내용',
      };
      const mockNotification = createNotificationMock(data);
      notificationRepository.createNotification.mockResolvedValue(mockNotification);

      // --- 실행 (Act) ---
      const result = await notificationService.createNotification(data, tx);

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
      expect(notificationRepository.createNotification).toHaveBeenCalledWith(createData, tx);
      expect(sendMessageSpy).not.toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });
  });
});
