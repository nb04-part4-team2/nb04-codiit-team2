import { Router } from 'express';
import { MetadataController } from './metadata.controller.js';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';

const router = Router();

const metadataController = new MetadataController();

router.get('/grade', asyncHandler(metadataController.getGrades));

export default router;
