import { Response } from 'express';
import { Notification } from '@prisma/client';
import { logger } from '@/config/logger.js';

// 타입 정의
interface SseClient {
  res: Response;
}

// sse 클래스
export class SseManager {
  private clients: Map<string, SseClient> = new Map();

  // 클라이언트 추가
  addClient(userId: string, client: SseClient) {
    this.clients.set(userId, client);
  }

  // 클라이언트 제거
  removeClient(userId: string) {
    this.clients.delete(userId);
  }

  // 메시지 전송
  sendMessage(userId: string, message: Partial<Notification>) {
    const client = this.clients.get(userId);
    if (client) {
      client.res.write(`data: ${JSON.stringify(message)}\n\n`);
    }
  }

  // 모든 SSE 연결 종료 (Graceful Shutdown 지원)
  closeAll() {
    logger.info(`📡 Closing ${this.clients.size} SSE connections...`);

    this.clients.forEach((client, userId) => {
      try {
        client.res.end();
        logger.info(`  ✅ Closed SSE for user: ${userId}`);
      } catch (error) {
        logger.error({ error, userId }, '  ❌ Error closing SSE');
      }
    });

    this.clients.clear();
    logger.info('✅ All SSE connections closed');
  }

  // 디버깅용
  getClients() {
    return this.clients;
  }
}

export const sseManager = new SseManager();
