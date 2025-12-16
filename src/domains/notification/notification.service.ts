import type { Prisma } from '@prisma/client';
import type { NotificationRepository } from './notification.repository.js';
import type { CreateNotificationBody } from './notification.type.js';
import { sseManager } from '@/common/utils/sse.manager.js';

export class NotificationService {
  constructor(private notificationRepository: NotificationRepository) {}

  // 사용자의 모든 알림 조회
  getNotifications = async (userId: string) => {
    const getQuery: Prisma.NotificationFindManyArgs = {
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    };

    const notifications = await this.notificationRepository.getNotifications(getQuery);

    return notifications;
  };

  // 알림 생성
  createNotification = async (
    notificationData: CreateNotificationBody,
    tx?: Prisma.TransactionClient,
  ) => {
    const { userId, content } = notificationData;

    const createData: Prisma.NotificationCreateInput = {
      user: {
        connect: {
          id: userId,
        },
      },
      content,
    };

    const notification = await this.notificationRepository.createNotification(createData, tx);

    if (!tx) {
      // sse 전송
      sseManager.sendMessage(userId, notification);
    }

    return notification;
  };
}
