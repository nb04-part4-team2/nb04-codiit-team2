import { Router } from 'express';
import { S3Controller } from './s3.controller.js';
import { S3Service } from './s3.service.js';
import { upload } from '@/common/middlewares/upload.middleware.js';
import { authenticate } from '@/common/middlewares/auth.middleware.js';

const s3Router = Router();
const s3Service = new S3Service();
const s3Controller = new S3Controller(s3Service);

s3Router.post('/upload', authenticate, upload.single('image'), s3Controller.uploadImage);

export default s3Router;
