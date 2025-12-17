import { MulterError } from 'multer';
import type { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '@/common/utils/errors.js'; // BadRequestError import 추가

export function uploadErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return next(new BadRequestError('파일 크기가 너무 큽니다. 5MB 이하로 업로드해주세요.'));

      case 'LIMIT_UNEXPECTED_FILE':
        return next(
          new BadRequestError('예상치 못한 파일 필드입니다. "image" 필드를 사용해주세요.'),
        );

      default:
        return next(new BadRequestError(`파일 업로드 중 오류가 발생했습니다: ${err.message}`));
    }
  }

  next(err);
}
