import { jest } from '@jest/globals';
import type { Prisma, Notification } from '@prisma/client';
import { NotificationRepository } from '@/domains/notification/notification.repository.js';
import { NotificationService } from '@/domains/notification/notification.service.js';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import {
  userId,
  notificationId,
  createNotificationMock,
  mockNotifications,
  mockFindNotification,
} from '../mocks/notification.mock.js';
import type { GetNotificationsQuery } from '@/domains/notification/notification.dto.js';
import { sseManager } from '@/common/utils/sse.manager.js';
import { NotFoundError, ForbiddenError } from '@/common/utils/errors.js';

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
    const query = {
      page: 1,
      pageSize: 10,
    };

    it('사용자의 모든 알림 조회 성공', async () => {
      // --- 준비 (Arrange) ---
      notificationRepository.countNotifications.mockResolvedValue(2);
      notificationRepository.getNotifications.mockResolvedValue(mockNotifications);

      // --- 실행 (Act) ---
      const result = await notificationService.getNotifications(query, userId);

      const countQuery = {
        where: { userId },
      };

      const getQuery = {
        where: { userId },
        take: 10,
        skip: 0,
        orderBy: {
          createdAt: 'desc',
        },
      };

      // --- 검증 (Assert) ---
      expect(notificationRepository.countNotifications).toHaveBeenCalledTimes(1);
      expect(notificationRepository.countNotifications).toHaveBeenCalledWith(countQuery);
      expect(notificationRepository.getNotifications).toHaveBeenCalledTimes(1);
      expect(notificationRepository.getNotifications).toHaveBeenCalledWith(getQuery);
      expect(result).toEqual({
        list: mockNotifications,
        totalCount: 2,
      });
    });

    it('query가 없을 경우, 기본값(page=1, pageSize=10)이 적용된다', async () => {
      // --- 준비 (Arrange) ---
      const query = {};
      notificationRepository.countNotifications.mockResolvedValue(0);
      notificationRepository.getNotifications.mockResolvedValue([]);

      // --- 실행 (Act) ---
      await notificationService.getNotifications(query as GetNotificationsQuery, userId);

      const getQuery = {
        where: { userId },
        take: 10,
        skip: 0,
        orderBy: {
          createdAt: 'desc',
        },
      };

      // --- 검증 (Assert) ---
      expect(notificationRepository.getNotifications).toHaveBeenCalledTimes(1);
      expect(notificationRepository.getNotifications).toHaveBeenCalledWith(getQuery);
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

  // 알림 수정 (읽음 처리)
  describe('updateNotification', () => {
    it('알림 수정 성공', async () => {
      // --- 준비 (Arrange) ---
      const mockNotification = createNotificationMock();
      notificationRepository.findNotificationById.mockResolvedValue(mockFindNotification);
      notificationRepository.updateNotification.mockResolvedValue(mockNotification);

      // --- 실행 (Act) ---
      const result = await notificationService.updateNotification(notificationId, userId);

      const updateData = {
        isChecked: true,
      };

      // --- 검증 (Assert) ---
      expect(notificationRepository.findNotificationById).toHaveBeenCalledTimes(1);
      expect(notificationRepository.findNotificationById).toHaveBeenCalledWith(notificationId);
      expect(notificationRepository.updateNotification).toHaveBeenCalledTimes(1);
      expect(notificationRepository.updateNotification).toHaveBeenCalledWith(
        notificationId,
        updateData,
      );
      expect(result).toEqual(mockNotification);
    });

    it('알림 수정 성공(이미 읽음)', async () => {
      // --- 준비 (Arrange) ---
      const mockFindNotificationChecked = {
        ...mockFindNotification,
        isChecked: true,
      };
      notificationRepository.findNotificationById.mockResolvedValue(mockFindNotificationChecked);

      // --- 실행 (Act) ---
      const result = await notificationService.updateNotification(notificationId, userId);

      // --- 검증 (Assert) ---
      expect(notificationRepository.findNotificationById).toHaveBeenCalledTimes(1);
      expect(notificationRepository.findNotificationById).toHaveBeenCalledWith(notificationId);
      expect(notificationRepository.updateNotification).not.toHaveBeenCalled();
      expect(result).toEqual(mockFindNotificationChecked);
    });

    it('알림이 존재하지 않을때 NotFoundError 발생', async () => {
      // --- 준비 (Arrange) ---
      notificationRepository.findNotificationById.mockResolvedValue(null);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(notificationService.updateNotification(notificationId, userId)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('알림을 수정할 권한이 없을때 ForbiddenError 발생', async () => {
      // --- 준비 (Arrange) ---
      const mockFindNotificationOwnedByOtherUser = {
        ...mockFindNotification,
        userId: '다른 사용자 ID',
      };
      notificationRepository.findNotificationById.mockResolvedValue(
        mockFindNotificationOwnedByOtherUser,
      );

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(notificationService.updateNotification(notificationId, userId)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });
});
