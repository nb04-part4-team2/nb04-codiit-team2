import type { Prisma } from '@prisma/client';
import type { NotificationRepository } from './notification.repository.js';
import type { CreateNotificationBody } from './notification.type.js';
import { NotFoundError, ForbiddenError } from '@/common/utils/errors.js';
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

  // 알림 수정 (읽음 처리)
  updateNotification = async (id: string, userId: string) => {
    // 알림 존재 및 인가 확인
    const findNotification = await this.notificationRepository.findNotificationById(id);
    if (!findNotification) throw new NotFoundError('알림을 찾을 수 없습니다.');
    if (findNotification.userId !== userId)
      throw new ForbiddenError('해당 알림에 대한 접근 권한이 없습니다.');

    // 이미 체크 된 알림은 얼리 리턴 사용
    // 코드잇 배포 사이트에서는 매번 DB에 쿼리를 날리는데 불필요하다고 생각됨
    if (findNotification.isChecked === true) {
      return findNotification;
    }

    const updateData: Prisma.NotificationUpdateInput = {
      isChecked: true,
    };

    const notification = await this.notificationRepository.updateNotification(id, updateData);

    return notification;
  };
}
