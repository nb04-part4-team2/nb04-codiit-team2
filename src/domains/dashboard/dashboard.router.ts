import { Router } from 'express';
import { dashboardController } from './dashboard.container.js';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { authenticate } from '@/common/middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, asyncHandler(dashboardController.getDashboardData));

export default router;
