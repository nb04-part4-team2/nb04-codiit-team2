import type { Request, Response } from 'express';
import type { NotificationService } from './notification.service.js';
import { UnauthorizedError } from '@/common/utils/errors.js';
import { sseManager } from '@/common/utils/sse.manager.js';
import { toGetNotifications, toUpdateNotification } from './notification.mapper.js';

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  // 사용자의 모든 알림 조회
  getNotifications = async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const userId = req.user.id;

    const notifications = await this.notificationService.getNotifications(userId);
    return res.status(200).json(toGetNotifications(notifications));
  };

  // sse 연결
  subscribe = async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const userId = req.user.id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseManager.addClient(userId, { res });

    // 연결이 끊겼을 때 클라이언트 제거
    req.on('close', () => {
      sseManager.removeClient(userId);
    });

    // 30초마다 더미 데이터 전송 (연결 유지)
    const intervalId = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 30000);

    // 연결 종료 시 클리어
    res.on('close', () => {
      clearInterval(intervalId);
      res.end();
    });
  };

  // 알림 수정 (읽음 처리)
  updateNotification = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const userId = req.user.id;

    const notification = await this.notificationService.updateNotification(id, userId);
    return res.status(200).json(toUpdateNotification(notification));
  };
}
