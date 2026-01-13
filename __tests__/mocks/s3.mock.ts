/**
 * File Upload Mock 인터페이스
 * uploadFile 함수의 인자 타입
 */
export interface MockFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

/**
 * File Upload Mock 데이터 생성 팩토리
 * Unit Test에서 uploadFile 함수 호출 시 사용
 */
export const createFileMock = (overrides: Partial<MockFile> = {}): MockFile => ({
  buffer: Buffer.from('test file content'),
  originalname: 'test-image.png',
  mimetype: 'image/png',
  ...overrides,
});

/**
 * S3 Upload Response Mock 데이터 생성 팩토리
 * uploadFile 함수의 반환값 타입
 */
export const createS3UploadResponseMock = (
  overrides: Partial<{ url: string; key: string }> = {},
) => ({
  url: 'https://mock-bucket.s3.mock-region.amazonaws.com/mock-random-uuid.png',
  key: 'mock-random-uuid.png',
  ...overrides,
});

/**
 * S3 Delete Response Mock 데이터 생성 팩토리
 * deleteFile 함수의 반환값 타입
 */
export const createS3DeleteResponseMock = (
  overrides: Partial<{ success: boolean; fileKey: string }> = {},
) => ({
  success: true,
  fileKey: 'mock-random-uuid.png',
  ...overrides,
});

/**
 * Test Environment Mock 데이터 생성 팩토리
 * Unit Test에서 env 객체 모킹 시 사용
 */
export const createTestEnvMock = () => ({
  NODE_ENV: 'test' as const,
  PORT: '3000',
  DATABASE_URL: 'postgresql://test',
  ACCESS_TOKEN_SECRET: 'test-secret',
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_SECRET: 'test-secret',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  CORS_ORIGIN: 'http://localhost:3001',
  BCRYPT_ROUNDS: '10',
  AWS_S3_BUCKET: 'mock-bucket',
  AWS_REGION: 'mock-region',
  AWS_ACCESS_KEY_ID: 'mock-access-key',
  AWS_SECRET_ACCESS_KEY: 'mock-secret-key',
});
