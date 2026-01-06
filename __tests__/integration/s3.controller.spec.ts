import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { testClient, authRequest } from '../helpers/testClient.js';
import { createTestContext, type TestContext } from '../helpers/dataFactory.js';
import { generateBuyerToken, generateSellerToken } from '../helpers/authHelper.js';

// ESM 환경에서 __dirname을 사용하기 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('S3 API Integration Test (No Mocking)', () => {
  let ctx: TestContext;
  let buyerToken: string;
  let sellerToken: string;

  beforeEach(async () => {
    ctx = await createTestContext();
    buyerToken = generateBuyerToken(ctx.buyer.id);
    sellerToken = generateSellerToken(ctx.seller.id);
  });

  // ===== POST /api/s3/upload - 이미지 업로드 =====
  describe('POST /api/s3/upload', () => {
    // attach에 사용하기 위해, 현재 파일 위치를 기준으로 이미지 파일의 절대 경로 계산
    const imagePath = path.resolve(__dirname, '../mocks/test-image.png');

    it('401: 인증 없이 업로드 시도 시 실패해야 합니다.', async () => {
      const response = await testClient.post('/api/s3/upload').attach('image', imagePath);

      expect(response.status).toBe(401);
    });

    it('400: 파일 없이 업로드 시도 시 실패해야 합니다.', async () => {
      const response = await authRequest(buyerToken).post('/api/s3/upload');

      expect(response.status).toBe(400);
      // upload.middleware.ts의 에러 메시지에 맞춰 수정
      expect(response.body.message).toBe('파일이 제공되지 않았습니다.');
    });

    it('201: 구매자가 이미지 업로드 성공 시 URL과 key를 반환해야 합니다.', async () => {
      const response = await authRequest(buyerToken)
        .post('/api/s3/upload')
        .attach('image', imagePath);

      expect(response.status).toBe(201);

      // URL과 key가 특정 값이 아닌, 올바른 형식의 문자열인지 검증
      expect(response.body.url).toEqual(expect.any(String));
      expect(response.body.key).toEqual(expect.any(String));

      // URL에 S3 도메인과 버킷 이름이 포함되어 있는지 검증
      // .env.test.local에 실제 버킷 정보가 있을 것을 가정
      const bucketName = process.env.AWS_S3_BUCKET || 'dummy-bucket';
      expect(response.body.url).toContain(`s3`);
      expect(response.body.url).toContain(bucketName);

      // key가 .png로 끝나는지 검증
      expect(response.body.key.endsWith('.png')).toBe(true);
    });

    it('201: 판매자가 이미지 업로드 성공 시 URL과 key를 반환해야 합니다.', async () => {
      const response = await authRequest(sellerToken)
        .post('/api/s3/upload')
        .attach('image', imagePath);

      expect(response.status).toBe(201);
      expect(response.body.url).toEqual(expect.any(String));
      expect(response.body.key).toEqual(expect.any(String));
    });
  });
});
