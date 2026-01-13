import { Router } from 'express';
import { userController } from './user.container.js';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { authenticate, excludeTestAccounts } from '@/common/middlewares/auth.middleware.js';
import { createUserSchema, updateUserSchema } from './user.schema.js';
import { validate } from '@/common/middlewares/validate.middleware.js';

const router = Router();

router.post('/', validate(createUserSchema, 'body'), asyncHandler(userController.createUser));

router.get('/me', authenticate, asyncHandler(userController.getMe));

router.patch(
  '/me',
  authenticate,
  excludeTestAccounts,
  validate(updateUserSchema, 'body'),
  asyncHandler(userController.updateMe),
);

router.get('/me/likes', authenticate, asyncHandler(userController.getLikedStores));

router.delete('/delete', authenticate, excludeTestAccounts, asyncHandler(userController.deleteMe));

export default router;
