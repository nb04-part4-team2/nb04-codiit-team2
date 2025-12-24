import { Router } from 'express';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { validate } from '@/common/middlewares/validate.middleware.js';
import { notificationController } from './notification.container.js';
import { authenticate } from '@/common/middlewares/auth.middleware.js';
import { idSchema, getNotificationsQuerySchema } from './notification.dto.js';

const notificationRouter = Router();

// 사용자 모든 알림 조회
notificationRouter.get(
  '/',
  authenticate,
  validate(getNotificationsQuerySchema, 'query'),
  asyncHandler(notificationController.getNotifications),
);

// sse 연결
notificationRouter.get('/sse', authenticate, asyncHandler(notificationController.subscribe));

// 알림 수정 (읽음 처리)
notificationRouter.patch(
  '/:id/check',
  authenticate,
  validate(idSchema, 'params'),
  asyncHandler(notificationController.updateNotification),
);

export { notificationRouter };
