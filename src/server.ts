import http from 'http';
import { app } from '@/app.js';
import { env } from '@/config/constants.js';
import { logger } from '@/config/logger.js';
import prisma from '@/config/prisma.js';
import { sseManager } from '@/common/utils/sse.manager.js';
import { orderService } from '@/domains/order/order.container.js';

// HTTP 서버 생성 (graceful shutdown을 위해 명시적 생성)
const server = http.createServer(app);

server.listen(env.PORT, () => {
  logger.info(`🚀 Server is running on http://localhost:${env.PORT}`);
  logger.info(`📦 Environment: ${env.NODE_ENV}`);
});

// 주문 만료 처리 interval
const EXPIRE_INTERVAL = 10 * 60 * 1000; // 10분

const expireIntervalId = setInterval(async () => {
  try {
    logger.info('[OrderExpireJob] 만료 주문 처리 시작');
    await orderService.expireWaitingOrder();
  } catch (error) {
    logger.error({ error }, '[OrderExpireJob] 만료 주문 처리 실패');
  }
}, EXPIRE_INTERVAL);

// Graceful Shutdown 핸들러
let isShuttingDown = false;

const gracefulShutdown = async (signal: string, timeout: number = 30000) => {
  // 중복 shutdown 방지
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.warn(`\n⚠️  ${signal} received. Starting graceful shutdown...`);

  // 주문 만료처리 interval 정리
  clearInterval(expireIntervalId);

  // SSE 연결 먼저 종료
  sseManager.closeAll();

  // 새 연결 거부 (진행 중인 요청은 완료까지 대기)
  server.close(async (err) => {
    if (err) {
      logger.error({ err }, '❌ Error during server close');
      process.exit(1);
    }

    logger.info('✅ HTTP server closed (no new connections)');

    try {
      // Prisma 커넥션 종료
      await prisma.$disconnect();
      logger.info('✅ Database connections closed');

      logger.info('🎉 Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, '❌ Error during database disconnect');
      process.exit(1);
    }
  });

  // 타임아웃: 지정된 시간 내 종료 안 되면 강제 종료
  setTimeout(() => {
    logger.error(`⏰ Shutdown timeout (${timeout / 1000}s) - forcing exit`);
    process.exit(1);
  }, timeout);
};

// SIGTERM: Docker stop 시 수신 (정상 종료 - 30초 여유)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM', 30000));

// SIGINT: Ctrl+C (로컬 개발용 - 30초 여유)
process.on('SIGINT', () => gracefulShutdown('SIGINT', 30000));

// 예상치 못한 에러 처리 (비정상 상태 - 10초만 대기)
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, '💥 Uncaught Exception');
  gracefulShutdown('uncaughtException', 10000);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, '💥 Unhandled Rejection');
  gracefulShutdown('unhandledRejection', 10000);
});
