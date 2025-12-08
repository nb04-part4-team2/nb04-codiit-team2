import { Router } from 'express';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { validate } from '@/common/middlewares/validate.middleware.js';
import { authenticate, onlySeller } from '@/common/middlewares/auth.middleware.js';
import { storeController } from './store.container.js';
import { createStoreSchema } from './store.schema.js';

const storeRouter = Router();

// POST /api/stores - 스토어 등록 (판매자 전용)
storeRouter.post(
  '/',
  authenticate,
  onlySeller,
  validate(createStoreSchema, 'body'),
  asyncHandler(storeController.createStore),
);

export { storeRouter };
