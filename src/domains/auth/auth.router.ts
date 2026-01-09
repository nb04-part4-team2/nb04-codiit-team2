import { Router } from 'express';
import { authController } from './auth.container.js';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { authenticate } from '@/common/middlewares/auth.middleware.js';
import { validate } from '@/common/middlewares/validate.middleware.js';
import { loginSchema } from './auth.schema.js';
import { loginRateLimiter, refreshRateLimiter } from '@/common/middlewares/rateLimit.middleware.js';

const router = Router();

router.post(
  '/login',
  loginRateLimiter,
  validate(loginSchema, 'body'),
  asyncHandler(authController.login),
);
router.post('/refresh', refreshRateLimiter, asyncHandler(authController.refresh));
router.post('/logout', authenticate, asyncHandler(authController.logout));

export default router;
