import { Router } from 'express';
import { metadataController } from './metadata.container.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const metadataRouter = Router();

metadataRouter.get('/grade', authenticate, metadataController.getMembershipInfo);

export default metadataRouter;
