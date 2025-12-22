import pino from 'pino';
import { env } from './constants.js';

export const logger = pino({
  // 테스트 환경: 로그 억제, 프로덕션: info, 개발: debug
  level: env.NODE_ENV === 'test' ? 'silent' : env.NODE_ENV === 'production' ? 'info' : 'debug',

  // 개발 환경: pino-pretty로 보기 좋게 출력
  // 프로덕션/테스트: JSON 형식으로 출력 (CloudWatch 등 수집 용이)
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            messageFormat: '{msg}',
          },
        }
      : undefined,

  // 로그 레벨 포맷 (info, error 등)
  formatters: {
    level: (label) => ({ level: label }),
  },
});
