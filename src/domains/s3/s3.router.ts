import { Router } from 'express';
import { S3Controller } from './s3.controller.js';
import { S3Service } from './s3.service.js';
import { upload } from '@/common/middlewares/upload.middleware.js';
import { authenticate } from '@/common/middlewares/auth.middleware.js';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';

const s3Router = Router();
const s3Service = new S3Service();
const s3Controller = new S3Controller(s3Service);

// POST /api/s3/upload
s3Router.post(
  '/upload',
  authenticate,
  upload.single('image'),
  asyncHandler(s3Controller.uploadImage),
);

export default s3Router;
