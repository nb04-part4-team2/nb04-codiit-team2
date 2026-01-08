import { jest, beforeEach, afterEach, describe, it, expect } from '@jest/globals';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { createUserWithGradeMock } from '../mocks/user.mock.js';
import { createLoginInputMock } from '../mocks/auth.mock.js';
import { UnauthorizedError } from '@/common/utils/errors.js';
import type { UserRepository } from '@/domains/user/user.repository.js';
import type { AuthRepository } from '@/domains/auth/auth.repository.js';

// JWT util mock
const mockGenerateAccessToken = jest.fn().mockReturnValue('mock-access-token');
const mockGenerateRefreshToken = jest.fn().mockReturnValue('mock-refresh-token');
const mockVerifyRefreshToken = jest.fn();

jest.unstable_mockModule('@/common/utils/jwt.util.js', () => ({
  generateAccessToken: mockGenerateAccessToken,
  generateRefreshToken: mockGenerateRefreshToken,
  verifyRefreshToken: mockVerifyRefreshToken,
}));

// bcrypt mock
const mockCompare = jest.fn<(data: string, encrypted: string) => Promise<boolean>>();
jest.unstable_mockModule('bcrypt', () => ({
  default: {
    compare: mockCompare,
  },
}));

// 동적 import (mock 설정 후)
const { AuthService } = await import('@/domains/auth/auth.service.js');

describe('AuthService 유닛 테스트', () => {
  let authService: InstanceType<typeof AuthService>;
  let userRepository: DeepMockProxy<UserRepository>;
  let authRepository: DeepMockProxy<AuthRepository>;

  const userId = 'user-id-1';

  beforeEach(() => {
    // 의존성 주입
    userRepository = mockDeep<UserRepository>();
    authRepository = mockDeep<AuthRepository>();
    authService = new AuthService(userRepository, authRepository);

    // 기본 mock 설정
    mockCompare.mockResolvedValue(true);
    mockGenerateAccessToken.mockReturnValue('mock-access-token');
    mockGenerateRefreshToken.mockReturnValue('mock-refresh-token');
    mockVerifyRefreshToken.mockReturnValue({ userId, type: 'BUYER', jti: 'mock-jti-uuid' });

    // AuthRepository 기본 mock 설정
    authRepository.createRefreshToken.mockResolvedValue({
      id: 'token-id',
      token: 'hashed-token',
      jti: 'mock-jti-uuid',
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });
    authRepository.findByToken.mockResolvedValue({
      id: 'token-id',
      token: 'hashed-token',
      jti: 'mock-jti-uuid',
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });
    authRepository.deleteByToken.mockResolvedValue({ count: 1 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // 로그인
  describe('login', () => {
    it('로그인 성공', async () => {
      // --- 준비 (Arrange) ---
      const inputData = createLoginInputMock();
      const user = createUserWithGradeMock({ email: inputData.email });

      userRepository.findByEmail.mockResolvedValue(user);

      // --- 실행 (Act) ---
      const result = await authService.login(inputData);

      // --- 검증 (Assert) ---
      expect(userRepository.findByEmail).toHaveBeenCalledWith(inputData.email);
      expect(mockCompare).toHaveBeenCalledWith(inputData.password, user.password);
      expect(mockGenerateAccessToken).toHaveBeenCalledWith(user.id, user.type);
      expect(mockGenerateRefreshToken).toHaveBeenCalledWith(user.id, user.type);
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user.email).toBe(inputData.email);
    });

    it('존재하지 않는 이메일인 경우 UnauthorizedError 발생', async () => {
      // --- 준비 (Arrange) ---
      const inputData = createLoginInputMock({ email: 'notfound@example.com' });

      userRepository.findByEmail.mockResolvedValue(null);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(authService.login(inputData)).rejects.toThrow(UnauthorizedError);
      expect(mockCompare).not.toHaveBeenCalled();
      expect(mockGenerateAccessToken).not.toHaveBeenCalled();
    });

    it('비밀번호가 틀린 경우 UnauthorizedError 발생', async () => {
      // --- 준비 (Arrange) ---
      const inputData = createLoginInputMock({ password: 'wrongpassword' });
      const user = createUserWithGradeMock({ email: inputData.email });

      userRepository.findByEmail.mockResolvedValue(user);
      mockCompare.mockResolvedValue(false);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(authService.login(inputData)).rejects.toThrow(UnauthorizedError);
      expect(mockGenerateAccessToken).not.toHaveBeenCalled();
    });
  });

  // 토큰 갱신
  describe('refresh', () => {
    it('토큰 갱신 성공', async () => {
      // --- 준비 (Arrange) ---
      const refreshToken = 'valid-refresh-token';
      const user = createUserWithGradeMock({ id: userId });

      mockVerifyRefreshToken.mockReturnValue({ userId, type: 'BUYER' });
      userRepository.findById.mockResolvedValue(user);

      // --- 실행 (Act) ---
      const result = await authService.refresh(refreshToken);

      // --- 검증 (Assert) ---
      expect(mockVerifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockGenerateAccessToken).toHaveBeenCalledWith(user.id, user.type);
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('사용자가 존재하지 않는 경우 UnauthorizedError 발생', async () => {
      // --- 준비 (Arrange) ---
      const refreshToken = 'valid-refresh-token';

      mockVerifyRefreshToken.mockReturnValue({ userId, type: 'BUYER' });
      userRepository.findById.mockResolvedValue(null);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedError);
      expect(mockGenerateAccessToken).not.toHaveBeenCalled();
    });

    it('유효하지 않은 토큰인 경우 에러 발생', async () => {
      // --- 준비 (Arrange) ---
      const invalidToken = 'invalid-token';

      mockVerifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(authService.refresh(invalidToken)).rejects.toThrow();
      expect(userRepository.findById).not.toHaveBeenCalled();
    });
  });

  // 로그아웃
  describe('logout', () => {
    it('로그아웃 성공', async () => {
      // --- 준비 (Arrange) ---
      const refreshToken = 'valid-refresh-token';

      // --- 실행 (Act) ---
      const result = await authService.logout(refreshToken);

      // --- 검증 (Assert) ---
      expect(authRepository.deleteByToken).toHaveBeenCalled();
      expect(result.message).toBe('로그아웃 되었습니다.');
    });
  });
});
