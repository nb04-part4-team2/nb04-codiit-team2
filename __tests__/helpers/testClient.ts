import request from 'supertest';
import { app } from '@/app.js';

/**
 * supertest 클라이언트
 * app을 직접 사용하여 HTTP 요청 테스트
 */
export const testClient = request(app);

/**
 * 인증된 요청을 위한 헬퍼
 * 자동으로 Authorization 헤더를 추가
 */
export const authRequest = (token: string) => ({
  get: (url: string) => testClient.get(url).set('Authorization', `Bearer ${token}`),
  post: (url: string) => testClient.post(url).set('Authorization', `Bearer ${token}`),
  patch: (url: string) => testClient.patch(url).set('Authorization', `Bearer ${token}`),
  put: (url: string) => testClient.put(url).set('Authorization', `Bearer ${token}`),
  delete: (url: string) => testClient.delete(url).set('Authorization', `Bearer ${token}`),
});
