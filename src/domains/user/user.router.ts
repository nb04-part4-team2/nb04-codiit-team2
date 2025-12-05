import { Router } from 'express';
import { UserController } from './user.controller.js';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';

const router = Router();
const userController = new UserController();

router.post('/', asyncHandler(userController.createUser));

export default router;
