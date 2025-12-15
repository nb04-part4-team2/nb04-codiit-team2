import { MulterError } from 'multer';
import type { Request, Response, NextFunction } from 'express';

export function uploadErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res
          .status(400)
          .json({ message: '파일 크기가 너무 큽니다. 5MB 이하로 업로드해주세요.' });

      case 'LIMIT_UNEXPECTED_FILE':
        return res
          .status(400)
          .json({ message: '예상치 못한 파일 필드입니다. "image" 필드를 사용해주세요.' });

      default:
        return res
          .status(400)
          .json({ message: `파일 업로드 중 오류가 발생했습니다: ${err.message}` });
    }
  }

  next(err);
}
