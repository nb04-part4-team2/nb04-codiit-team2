import { Response } from 'express';
import { Notification } from '@prisma/client';

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

  // 디버깅용
  getClients() {
    return this.clients;
  }
}

export const sseManager = new SseManager();
