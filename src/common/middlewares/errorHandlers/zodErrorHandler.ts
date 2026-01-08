import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { BadRequestError } from '@/common/utils/errors.js';
import { logger } from '@/config/logger.js';

export function zodErrorHandler(err: Error, req: Request, _res: Response, next: NextFunction) {
  // zod 에러 확인
  if (err instanceof ZodError) {
    const errorDetails = err.issues.map((issue) => {
      return {
        field: issue.path.join('.'), // 에러가 발생한 필드 이름
        message: issue.message, // Zod 스키마에 정의된 에러 메시지
      };
    });

    // ✅ logger 사용 (Zod 에러는 예상 가능한 에러이므로 warn 레벨)
    logger.warn(
      {
        err,
        errorType: 'ZodError',
        url: req.originalUrl,
        method: req.method,
        userId: req.user?.id,
        validationErrors: errorDetails,
      },
      'Zod validation error',
    );

    // 에러 객체에 상세 정보를 추가
    const badRequestError = new BadRequestError('유효성 검증에 실패했습니다.', errorDetails);

    return next(badRequestError);
  }

  // Zod 에러가 아니라면, 다음 에러 핸들러로 그냥 넘깁니다.
  next(err);
}
