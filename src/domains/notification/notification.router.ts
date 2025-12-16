import { Router } from 'express';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { notificationController } from './notification.container.js';
import { authenticate } from '@/common/middlewares/auth.middleware.js';

const notificationRouter = Router();

// 사용자 모든 알림 조회
notificationRouter.get(
  '/',
  authenticate,
  // 커서 방식 페이지 네이션 필요해 보임
  // validate(offsetSchema, 'query'), 배포 사이트에는 페이지 네이션이 없는데 나중에 추가 해야 할듯함,
  asyncHandler(notificationController.getNotifications),
);

// sse 연결
notificationRouter.get('/sse', authenticate, asyncHandler(notificationController.subscribe));

export { notificationRouter };
