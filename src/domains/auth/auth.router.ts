import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { authenticate } from '@/common/middlewares/auth.middleware.js';
import { validate } from '@/common/middlewares/validate.middleware.js';
import { loginSchema } from './auth.schema.js';
const router = Router();
const authController = new AuthController();

router.post('/login', validate(loginSchema, 'body'), asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/logout', authenticate, asyncHandler(authController.logout));

export default router;
