import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { testClient, authRequest } from '../helpers/testClient.js';
import { createTestContext, type TestContext } from '../helpers/dataFactory.js';
import { generateBuyerToken, generateSellerToken } from '../helpers/authHelper.js';
import { uploadFile } from '@/common/utils/s3.util.js';

jest.mock('@/common/utils/s3.util.js', () => ({
  __esModule: true,
  uploadFile: jest.fn(),
}));

// ESM 환경에서 __dirname을 사용하기 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('S3 API Integration Test (with Mocking)', () => {
  let ctx: TestContext;
  let buyerToken: string;
  let sellerToken: string;

  const mockedUploadFile = uploadFile as jest.MockedFunction<typeof uploadFile>;

  beforeEach(async () => {
    ctx = await createTestContext();
    buyerToken = generateBuyerToken(ctx.buyer.id);
    sellerToken = generateSellerToken(ctx.seller.id);

    mockedUploadFile.mockResolvedValue({
      url: 'https://mock-bucket.s3.ap-northeast-2.amazonaws.com/mock-key.png',
      key: 'mock-key.png',
    });
  });

  afterEach(() => {
    mockedUploadFile.mockClear();
  });

  // ===== POST /api/s3/upload - 이미지 업로드 =====
  describe('POST /api/s3/upload', () => {
    const imagePath = path.resolve(__dirname, '../mocks/test-image.png');

    it('401: 인증 없이 업로드 시도 시 실패해야 합니다.', async () => {
      const response = await testClient.post('/api/s3/upload').attach('image', imagePath);
      expect(response.status).toBe(401);
      expect(mockedUploadFile).not.toHaveBeenCalled();
    });

    it('400: 파일 없이 업로드 시도 시 실패해야 합니다.', async () => {
      const response = await authRequest(buyerToken).post('/api/s3/upload');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('파일이 제공되지 않았습니다.');
      expect(mockedUploadFile).not.toHaveBeenCalled();
    });

    it('201: 구매자가 이미지 업로드 성공 시 URL과 key를 반환해야 합니다.', async () => {
      const response = await authRequest(buyerToken)
        .post('/api/s3/upload')
        .attach('image', imagePath);

      expect(response.status).toBe(201);
      expect(mockedUploadFile).toHaveBeenCalledTimes(1);

      expect(response.body.url).toBe(
        'https://mock-bucket.s3.ap-northeast-2.amazonaws.com/mock-key.png',
      );
      expect(response.body.key).toBe('mock-key.png');
    });

    it('201: 판매자가 이미지 업로드 성공 시 URL과 key를 반환해야 합니다.', async () => {
      const response = await authRequest(sellerToken)
        .post('/api/s3/upload')
        .attach('image', imagePath);

      expect(response.status).toBe(201);
      expect(mockedUploadFile).toHaveBeenCalledTimes(1);

      expect(response.body.url).toBe(
        'https://mock-bucket.s3.ap-northeast-2.amazonaws.com/mock-key.png',
      );
      expect(response.body.key).toBe('mock-key.png');
    });
  });
});
