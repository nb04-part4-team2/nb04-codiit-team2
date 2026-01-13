import { Router } from 'express';
import { metadataController } from './metadata.container.js';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';

const metadataRouter = Router();

metadataRouter.get('/grade', asyncHandler(metadataController.getGrades));

export default metadataRouter;
