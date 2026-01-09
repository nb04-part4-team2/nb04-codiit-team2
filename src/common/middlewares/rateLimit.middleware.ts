import rateLimit from 'express-rate-limit';
import { env } from '@/config/constants.js';
import { logger } from '@/config/logger.js';
import { SecurityEventType } from '@/common/types/securityEvents.type.js';

// 밀리초를 초로 변환 (retryAfter용)
const toRetryAfterSeconds = (ms: number): number => Math.ceil(ms / 1000);

// 전역 Rate Limiter (15분/300번)
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(
      {
        event: SecurityEventType.RATE_LIMIT_EXCEEDED,
        ip: req.ip,
        path: req.path,
        limit: env.RATE_LIMIT_MAX,
        window: env.RATE_LIMIT_WINDOW,
      },
      `Global rate limit exceeded: ${req.path}`,
    );
    res.status(429).json({
      message: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
      retryAfter: toRetryAfterSeconds(env.RATE_LIMIT_WINDOW_MS),
    });
  },
});

// 로그인 Rate Limiter (15분/5번)
export const loginRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_AUTH_LOGIN_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH_LOGIN_MAX,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(
      {
        event: SecurityEventType.RATE_LIMIT_LOGIN_EXCEEDED,
        ip: req.ip,
        path: req.path,
        email: req.body?.email,
        limit: env.RATE_LIMIT_AUTH_LOGIN_MAX,
        window: env.RATE_LIMIT_AUTH_LOGIN_WINDOW,
      },
      'Login rate limit exceeded (possible brute-force attempt)',
    );
    res.status(429).json({
      message: '로그인 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
      retryAfter: toRetryAfterSeconds(env.RATE_LIMIT_AUTH_LOGIN_WINDOW_MS),
    });
  },
});

// Refresh Token Rate Limiter (1분/30번)
export const refreshRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_AUTH_REFRESH_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH_REFRESH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(
      {
        event: SecurityEventType.RATE_LIMIT_REFRESH_EXCEEDED,
        ip: req.ip,
        path: req.path,
        limit: env.RATE_LIMIT_AUTH_REFRESH_MAX,
        window: env.RATE_LIMIT_AUTH_REFRESH_WINDOW,
      },
      'Refresh token rate limit exceeded (possible infinite refresh loop)',
    );
    res.status(429).json({
      message: 'Refresh Token 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      retryAfter: toRetryAfterSeconds(env.RATE_LIMIT_AUTH_REFRESH_WINDOW_MS),
    });
  },
});
