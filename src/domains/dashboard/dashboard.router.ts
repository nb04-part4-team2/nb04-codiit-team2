import { Router } from 'express';
import { dashboardController } from './dashboard.container.js';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { authenticate, onlySeller } from '@/common/middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, onlySeller, asyncHandler(dashboardController.getDashboardData));

export default router;
