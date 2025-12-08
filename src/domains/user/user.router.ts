import { Router } from 'express';
import { UserController } from './user.controller.js';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { createUserSchema } from './user.schema.js';
import { validate } from '@/common/middlewares/validate.middleware.js';

const router = Router();
const userController = new UserController();

router.post('/', validate(createUserSchema, 'body'), asyncHandler(userController.createUser));

export default router;
