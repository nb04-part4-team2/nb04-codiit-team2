import type { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger.js';
import { env } from '@/config/constants.js';

export function catchAllErrorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error(
    {
      err,
      errorType: err.name,
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
      body: env.NODE_ENV === 'development' ? req.body : undefined, // 개발 환경만
    },
    'Unhandled error',
  );

  res.status(500).json({ message: '서버 내부에서 에러가 발생했습니다.' });
}
