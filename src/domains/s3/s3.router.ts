import { Router } from 'express';
import { S3Controller } from './s3.controller.js';
import { S3Service } from './s3.service.js';
import { upload } from '@/common/middlewares/upload.middleware.js';
import { mockAuthMiddleware } from '@/common/middlewares/mock.auth.middleware.js';

const s3Router = Router();
const s3Service = new S3Service();
const s3Controller = new S3Controller(s3Service);

// POST /api/s3/upload
// TODO: 실제 인증 미들웨어(authMiddleware)로 교체해야 합니다.
s3Router.post('/upload', mockAuthMiddleware, upload.single('image'), s3Controller.uploadImage);

export default s3Router;
