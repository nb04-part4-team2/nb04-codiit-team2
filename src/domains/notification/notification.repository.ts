import type { Prisma, PrismaClient } from '@prisma/client';

export class NotificationRepository {
  constructor(private prisma: PrismaClient) {}

  // 사용자의 모든 알림 조회
  getNotifications = async (getQuery: Prisma.NotificationFindManyArgs) => {
    const notifications = await this.prisma.notification.findMany({
      ...getQuery,
      select: {
        id: true,
        userId: true,
        content: true,
        isChecked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return notifications;
  };

  // 알림 생성
  createNotification = async (
    createData: Prisma.NotificationCreateInput,
    tx?: Prisma.TransactionClient,
  ) => {
    const prismaClient = tx ?? this.prisma;
    const notification = await prismaClient.notification.create({
      data: createData,
    });

    return notification;
  };
}
