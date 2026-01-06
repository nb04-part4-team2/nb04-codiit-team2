import { jest, describe, it, expect, afterEach } from '@jest/globals';
import { InternalServerError } from '../../src/common/utils/errors.js';

// --- Mocks ---

// crypto.randomUUID 모킹
const mockRandomUUID = jest.fn(() => 'mock-random-uuid');
jest.unstable_mockModule('crypto', () => ({
  randomUUID: mockRandomUUID,
}));

// @aws-sdk/client-s3 모킹
const mockSend: jest.Mock<(...args: unknown[]) => Promise<unknown>> = jest.fn();
jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  PutObjectCommand: jest.fn().mockImplementation((args: unknown) => ({
    constructor: { name: 'PutObjectCommand' },
    ...(args as object),
  })),
  DeleteObjectCommand: jest.fn().mockImplementation((args: unknown) => ({
    constructor: { name: 'DeleteObjectCommand' },
    ...(args as object),
  })),
}));

// 환경 변수 설정
// s3.util.ts의 getS3Client 함수가 에러를 던지지 않도록 미리 설정합니다.
process.env.AWS_S3_BUCKET = 'mock-bucket';
process.env.AWS_REGION = 'mock-region';
process.env.AWS_ACCESS_KEY_ID = 'mock-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'mock-secret-key';

// --- 테스트 대상 동적 import ---
// 모킹 설정이 완료된 후, 테스트할 모듈을 동적으로 가져옵니다.
const { uploadFile, deleteFile } = await import('../../src/common/utils/s3.util.js');

// sentCommand의 타입을 위한 인터페이스
interface MockCommand {
  constructor: { name: string };
  Bucket: string;
  Key: string;
  Body?: Buffer;
  ContentType?: string;
}

// --- 테스트 스위트 ---
describe('s3.util.ts 유닛 테스트', () => {
  afterEach(() => {
    // 각 테스트가 끝난 후 mock 함수의 호출 기록을 초기화합니다.
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    const file = {
      buffer: Buffer.from('test file content'),
      originalname: 'test-image.png',
      mimetype: 'image/png',
    };

    it('파일 업로드 성공 시 URL과 key를 반환해야 합니다.', async () => {
      // --- 준비 (Arrange) ---
      // S3 send가 성공적으로 완료된 것처럼 설정
      mockSend.mockResolvedValue({});
      const expectedKey = 'mock-random-uuid.png';
      const expectedUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${expectedKey}`;

      // --- 실행 (Act) ---
      const result = await uploadFile(file);

      // --- 검증 (Assert) ---
      // 1. send 함수가 한 번 호출되었는지 확인
      expect(mockSend).toHaveBeenCalledTimes(1);

      // 2. PutObjectCommand와 함께 올바른 인자로 호출되었는지 확인
      const sentCommand = mockSend.mock.calls[0][0] as MockCommand;
      expect(sentCommand.constructor.name).toBe('PutObjectCommand');
      expect(sentCommand.Bucket).toBe(process.env.AWS_S3_BUCKET);
      expect(sentCommand.Key).toBe(expectedKey);
      expect(sentCommand.Body).toEqual(file.buffer);
      expect(sentCommand.ContentType).toBe(file.mimetype);

      // 3. 반환값이 예상과 일치하는지 확인
      expect(result).toEqual({ url: expectedUrl, key: expectedKey });
    });

    it('S3 client.send 실패 시 InternalServerError를 던져야 합니다.', async () => {
      // --- 준비 (Arrange) ---
      const errorMessage = 'S3 is down';
      mockSend.mockRejectedValue(new Error(errorMessage));

      // console.error 출력을 일시적으로 막습니다.
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(uploadFile(file)).rejects.toThrow(InternalServerError);

      // 스파이를 복원합니다.
      consoleErrorSpy.mockRestore();
    });
  });

  describe('deleteFile', () => {
    const fileKey = 'mock-random-uuid.png';

    it('파일 삭제 성공 시 success: true와 fileKey를 반환해야 합니다.', async () => {
      // --- 준비 (Arrange) ---
      mockSend.mockResolvedValue({});

      // --- 실행 (Act) ---
      const result = await deleteFile(fileKey);

      // --- 검증 (Assert) ---
      // 1. send 함수가 한 번 호출되었는지 확인
      expect(mockSend).toHaveBeenCalledTimes(1);

      // 2. DeleteObjectCommand와 함께 올바른 인자로 호출되었는지 확인
      const sentCommand = mockSend.mock.calls[0][0] as MockCommand;
      expect(sentCommand.constructor.name).toBe('DeleteObjectCommand');
      expect(sentCommand.Bucket).toBe(process.env.AWS_S3_BUCKET);
      expect(sentCommand.Key).toBe(fileKey);

      // 3. 반환값이 예상과 일치하는지 확인
      expect(result).toEqual({ success: true, fileKey });
    });

    it('S3 client.send 실패 시 InternalServerError를 던져야 합니다.', async () => {
      // --- 준비 (Arrange) ---
      const errorMessage = 'S3 is down';
      mockSend.mockRejectedValue(new Error(errorMessage));

      // console.error 출력을 일시적으로 막습니다.
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(deleteFile(fileKey)).rejects.toThrow(InternalServerError);

      // 스파이를 복원합니다.
      consoleErrorSpy.mockRestore();
    });
  });
});
