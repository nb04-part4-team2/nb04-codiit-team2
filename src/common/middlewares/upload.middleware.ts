import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { BadRequestError } from '../utils/errors.js';

const storage = multer.memoryStorage();

const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
};

const allowedMimeTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'];

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('지원되지 않는 파일 형식입니다. (png, jpg, jpeg, gif, webp)'));
  }
};

export const upload = multer({ storage, limits, fileFilter });
