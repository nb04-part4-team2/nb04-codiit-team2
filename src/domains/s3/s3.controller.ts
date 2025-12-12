import { Request, Response } from 'express';
import { S3Service } from './s3.service.js';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';

export class S3Controller {
  constructor(private s3Service: S3Service) {}

  uploadImage = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: '파일이 제공되지 않았습니다.' });
    }

    const result = await this.s3Service.uploadImage(file);
    res.status(201).json(result);
  });
}
