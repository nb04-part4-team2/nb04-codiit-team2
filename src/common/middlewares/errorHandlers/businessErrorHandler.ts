import type { Request, Response, NextFunction } from 'express';
import { AppError } from '@/common/utils/appError.js';
import jwt from 'jsonwebtoken';
import { logger } from '@/config/logger.js';

export function businessErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // AppError의 인스턴스인지 확인
  if (err instanceof AppError) {
    logger.warn(
      {
        err,
        errorType: err.name,
        statusCode: err.statusCode,
        url: req.originalUrl,
        method: req.method,
        userId: req.user?.id,
        query: req.query,
        details: err.details,
      },
      `Business error: ${err.message}`,
    );

    return res.status(err.statusCode).json({
      message: err.message,
      details: err.details ?? [], // details가 undefined이면 빈 배열
    });
  } else if (err instanceof jwt.TokenExpiredError) {
    logger.warn(
      {
        err,
        errorType: 'TokenExpiredError',
        url: req.originalUrl,
        method: req.method,
      },
      'JWT token expired',
    );

    return res.status(401).json({
      name: err.name,
      message: err.message,
    });
  } else if (err instanceof jwt.JsonWebTokenError) {
    logger.warn(
      {
        err,
        errorType: 'JsonWebTokenError',
        url: req.originalUrl,
        method: req.method,
      },
      'JWT token invalid',
    );

    return res.status(401).json({
      name: err.name,
      message: '유효하지 않은 토큰입니다.',
    }); //모든 jwt 검증 실패에 대한 401 반환
  }
  // AppError가 아니라면, 처리할 수 없는 에러이므로 다음 핸들러로
  return next(err);
}
