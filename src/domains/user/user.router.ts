import { Router } from 'express';
import { UserController } from './user.controller.js';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { authenticate } from '@/common/middlewares/auth.middleware.js';
import { createUserSchema, updateUserSchema } from './user.schema.js';
import { validate } from '@/common/middlewares/validate.middleware.js';

const router = Router();
const userController = new UserController();

router.post('/', validate(createUserSchema, 'body'), asyncHandler(userController.createUser));

router.get('/me', authenticate, asyncHandler(userController.getMe));

router.patch(
  '/me',
  authenticate,
  validate(updateUserSchema, 'body'),
  asyncHandler(userController.updateMe),
);

export default router;
