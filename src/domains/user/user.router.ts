import { Router } from 'express';
import { UserController } from '@/domains/user/user.controller.js';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { createUserSchema } from '@/domains/user/user.schema.js';
import { validate } from '@/common/middlewares/validate.middleware.js';

const router = Router();
const userController = new UserController();

router.post('/', validate(createUserSchema, 'body'), asyncHandler(userController.createUser));

export default router;
