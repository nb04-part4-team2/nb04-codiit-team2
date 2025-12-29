import { jest, beforeEach, afterEach, describe, it, expect } from '@jest/globals';
import { UserRepository } from '@/domains/user/user.repository.js';
import { UserService } from '@/domains/user/user.service.js';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import {
  createUserWithGradeMock,
  createUserInputMock,
  updateUserInputMock,
  createStoreLikeRawMock,
} from '../mocks/user.mock.js';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
} from '@/common/utils/errors.js';
import bcrypt from 'bcrypt';

describe('UserService 유닛 테스트', () => {
  let userService: UserService;
  let userRepository: DeepMockProxy<UserRepository>;
  let hashSpy: jest.SpiedFunction<typeof bcrypt.hash>;
  let compareSpy: jest.SpiedFunction<typeof bcrypt.compare>;

  const userId = 'user-id-1';

  // 테스트 케이스가 실행되기 전에 매번 실행
  beforeEach(() => {
    // 의존성 주입
    userRepository = mockDeep<UserRepository>();
    userService = new UserService(userRepository);

    // bcrypt spyOn mock
    hashSpy = jest.spyOn(bcrypt, 'hash') as jest.SpiedFunction<typeof bcrypt.hash>;
    compareSpy = jest.spyOn(bcrypt, 'compare') as jest.SpiedFunction<typeof bcrypt.compare>;

    hashSpy.mockResolvedValue('hashed-password' as never);
    compareSpy.mockResolvedValue(true as never);
  });

  // 각 테스트가 끝난 후 모든 모의(mock)를 원래대로 복원
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  // 회원가입
  describe('createUser', () => {
    it('회원가입 성공', async () => {
      // --- 준비 (Arrange) ---
      const inputData = createUserInputMock();
      const expectedUser = createUserWithGradeMock({ email: inputData.email });

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(expectedUser);

      // --- 실행 (Act) ---
      const result = await userService.createUser(inputData);

      // --- 검증 (Assert) ---
      expect(userRepository.findByEmail).toHaveBeenCalledWith(inputData.email);
      expect(userRepository.create).toHaveBeenCalledTimes(1);
      expect(result.email).toBe(inputData.email);
    });

    it('이미 존재하는 이메일인 경우 ConflictError 발생', async () => {
      // --- 준비 (Arrange) ---
      const inputData = createUserInputMock();
      const existingUser = createUserWithGradeMock();

      userRepository.findByEmail.mockResolvedValue(existingUser);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(userService.createUser(inputData)).rejects.toThrow(ConflictError);
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  // 내 정보 조회
  describe('getMe', () => {
    it('내 정보 조회 성공', async () => {
      // --- 준비 (Arrange) ---
      const user = createUserWithGradeMock({ id: userId });

      userRepository.findById.mockResolvedValue(user);

      // --- 실행 (Act) ---
      const result = await userService.getMe(userId);

      // --- 검증 (Assert) ---
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(result.id).toBe(userId);
    });

    it('유저가 존재하지 않으면 NotFoundError 발생', async () => {
      // --- 준비 (Arrange) ---
      userRepository.findById.mockResolvedValue(null);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(userService.getMe(userId)).rejects.toThrow(NotFoundError);
    });
  });

  // 내 정보 수정
  describe('updateMe', () => {
    it('내 정보 수정 성공', async () => {
      // --- 준비 (Arrange) ---
      const user = createUserWithGradeMock({ id: userId });
      const updateData = updateUserInputMock({ name: '변경된 이름' });
      const updatedUser = createUserWithGradeMock({ id: userId, name: '변경된 이름' });

      userRepository.findById.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(updatedUser);

      // --- 실행 (Act) ---
      const result = await userService.updateMe(userId, updateData);

      // --- 검증 (Assert) ---
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(userRepository.update).toHaveBeenCalledTimes(1);
      expect(result.name).toBe('변경된 이름');
    });

    it('유저가 존재하지 않으면 NotFoundError 발생', async () => {
      // --- 준비 (Arrange) ---
      const updateData = updateUserInputMock();

      userRepository.findById.mockResolvedValue(null);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(userService.updateMe(userId, updateData)).rejects.toThrow(NotFoundError);
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('현재 비밀번호가 틀리면 ForbiddenError 발생', async () => {
      // --- 준비 (Arrange) ---
      const user = createUserWithGradeMock({ id: userId });
      const updateData = updateUserInputMock();

      userRepository.findById.mockResolvedValue(user);
      compareSpy.mockResolvedValue(false as never);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(userService.updateMe(userId, updateData)).rejects.toThrow(ForbiddenError);
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('수정할 내용이 없으면 BadRequestError 발생', async () => {
      // --- 준비 (Arrange) ---
      const updateData = { currentPassword: 'current1234' };

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(userService.updateMe(userId, updateData)).rejects.toThrow(BadRequestError);
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('이미지만 변경하는 경우 성공', async () => {
      // --- 준비 (Arrange) ---
      const user = createUserWithGradeMock({ id: userId });
      const imageUrl = 'https://example.com/new-image.jpg';
      const updateData = { currentPassword: 'current1234', imageUrl };
      const updatedUser = createUserWithGradeMock({ id: userId, image: imageUrl });

      userRepository.findById.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(updatedUser);

      // --- 실행 (Act) ---
      const result = await userService.updateMe(userId, updateData);

      // --- 검증 (Assert) ---
      expect(userRepository.update).toHaveBeenCalledWith(userId, { image: imageUrl });
      expect(result.image).toBe(imageUrl);
    });

    it('비밀번호만 변경하는 경우 성공', async () => {
      // --- 준비 (Arrange) ---
      const user = createUserWithGradeMock({ id: userId });
      const updateData = { currentPassword: 'current1234', password: 'newPassword123' };
      const updatedUser = createUserWithGradeMock({ id: userId });

      userRepository.findById.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(updatedUser);

      // --- 실행 (Act) ---
      const result = await userService.updateMe(userId, updateData);

      // --- 검증 (Assert) ---
      expect(userRepository.update).toHaveBeenCalledWith(userId, { password: 'hashed-password' });
      expect(result.id).toBe(userId);
    });

    it('이름과 이미지를 동시에 변경하는 경우 성공', async () => {
      // --- 준비 (Arrange) ---
      const user = createUserWithGradeMock({ id: userId });
      const imageUrl = 'https://example.com/new-image.jpg';
      const updateData = { currentPassword: 'current1234', name: '새로운 이름', imageUrl };
      const updatedUser = createUserWithGradeMock({
        id: userId,
        name: '새로운 이름',
        image: imageUrl,
      });

      userRepository.findById.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(updatedUser);

      // --- 실행 (Act) ---
      const result = await userService.updateMe(userId, updateData);

      // --- 검증 (Assert) ---
      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        name: '새로운 이름',
        image: imageUrl,
      });
      expect(result.name).toBe('새로운 이름');
      expect(result.image).toBe(imageUrl);
    });
  });

  // 관심 스토어 조회
  describe('getLikedStores', () => {
    it('관심 스토어 조회 성공', async () => {
      // --- 준비 (Arrange) ---
      const user = createUserWithGradeMock({ id: userId });
      const storeLikes = [createStoreLikeRawMock({ userId })];

      userRepository.findById.mockResolvedValue(user);
      userRepository.findLikedStores.mockResolvedValue(storeLikes);

      // --- 실행 (Act) ---
      const result = await userService.getLikedStores(userId);

      // --- 검증 (Assert) ---
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(userRepository.findLikedStores).toHaveBeenCalledWith(userId);
      expect(result).toHaveLength(1);
    });

    it('유저가 존재하지 않으면 NotFoundError 발생', async () => {
      // --- 준비 (Arrange) ---
      userRepository.findById.mockResolvedValue(null);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(userService.getLikedStores(userId)).rejects.toThrow(NotFoundError);
      expect(userRepository.findLikedStores).not.toHaveBeenCalled();
    });

    it('관심 스토어가 없으면 빈 배열 반환', async () => {
      // --- 준비 (Arrange) ---
      const user = createUserWithGradeMock({ id: userId });

      userRepository.findById.mockResolvedValue(user);
      userRepository.findLikedStores.mockResolvedValue([]);

      // --- 실행 (Act) ---
      const result = await userService.getLikedStores(userId);

      // --- 검증 (Assert) ---
      expect(result).toEqual([]);
    });
  });

  // 회원 탈퇴
  describe('deleteMe', () => {
    it('회원 탈퇴 성공', async () => {
      // --- 준비 (Arrange) ---
      const user = createUserWithGradeMock({ id: userId });

      userRepository.findById.mockResolvedValue(user);
      userRepository.delete.mockResolvedValue(user);

      // --- 실행 (Act) ---
      await userService.deleteMe(userId);

      // --- 검증 (Assert) ---
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(userRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('유저가 존재하지 않으면 NotFoundError 발생', async () => {
      // --- 준비 (Arrange) ---
      userRepository.findById.mockResolvedValue(null);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(userService.deleteMe(userId)).rejects.toThrow(NotFoundError);
      expect(userRepository.delete).not.toHaveBeenCalled();
    });
  });
});
