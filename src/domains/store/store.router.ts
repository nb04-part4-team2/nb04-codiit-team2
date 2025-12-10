import { Router } from 'express';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { validate } from '@/common/middlewares/validate.middleware.js';
import { authenticate, onlySeller, onlyBuyer } from '@/common/middlewares/auth.middleware.js';
import { storeController } from './store.container.js';
import {
  createStoreSchema,
  updateStoreSchema,
  storeIdParamSchema,
  storeProductQuerySchema,
} from './store.schema.js';

const storeRouter = Router();

// POST /api/stores - 스토어 등록 (판매자 전용)
storeRouter.post(
  '/',
  authenticate,
  onlySeller,
  validate(createStoreSchema, 'body'),
  asyncHandler(storeController.createStore),
);

// GET /api/stores/detail/my - 내 스토어 상세 조회 (판매자 전용)
storeRouter.get(
  '/detail/my',
  authenticate,
  onlySeller,
  asyncHandler(storeController.getMyStoreDetail),
);

// GET /api/stores/detail/my/product - 내 스토어 상품 목록 조회 (판매자 전용)
storeRouter.get(
  '/detail/my/product',
  authenticate,
  onlySeller,
  validate(storeProductQuerySchema, 'query'),
  asyncHandler(storeController.getMyStoreProducts),
);

// GET /api/stores/:storeId - 스토어 상세 조회 (공개)
storeRouter.get(
  '/:storeId',
  validate(storeIdParamSchema, 'params'),
  asyncHandler(storeController.getStoreDetail),
);

// PATCH /api/stores/:storeId - 스토어 수정 (판매자 전용, 본인 스토어만)
storeRouter.patch(
  '/:storeId',
  authenticate,
  onlySeller,
  validate(storeIdParamSchema, 'params'),
  validate(updateStoreSchema, 'body'),
  asyncHandler(storeController.updateStore),
);

// POST /api/stores/:storeId/favorite - 관심 스토어 등록 (구매자 전용)
storeRouter.post(
  '/:storeId/favorite',
  authenticate,
  onlyBuyer,
  validate(storeIdParamSchema, 'params'),
  asyncHandler(storeController.registerFavorite),
);

// DELETE /api/stores/:storeId/favorite - 관심 스토어 해제 (구매자 전용)
storeRouter.delete(
  '/:storeId/favorite',
  authenticate,
  onlyBuyer,
  validate(storeIdParamSchema, 'params'),
  asyncHandler(storeController.unregisterFavorite),
);

export { storeRouter };
