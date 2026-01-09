import bcrypt from 'bcrypt';
import { env } from '@/config/constants.js';
import { CreateUserDto, UpdateUserDto } from './user.schema.js';
import { UserRepository } from './user.repository.js';
import type { UserResponseDto, StoreLikeResponseDto } from './user.dto.js';
import { toUserResponse, toStoreLikeResponse } from './user.mapper.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '@/common/utils/errors.js';
import { logger } from '@/config/logger.js';
import { SecurityEventType } from '@/common/types/security-events.type.js';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    const { name, email, password, type } = dto;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      logger.warn(
        {
          event: SecurityEventType.DUPLICATE_RESOURCE,
          email,
          resource: 'user',
        },
        'User creation failed - email already exists',
      );
      throw new ConflictError('이미 존재하는 이메일입니다.');
    }

    const hashedPassword = await bcrypt.hash(password, Number(env.BCRYPT_ROUNDS));

    const user = await this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      type,
      gradeId: 'grade_green',
    });

    logger.info(
      {
        event: SecurityEventType.USER_CREATED,
        userId: user.id,
        email: user.email,
        userType: user.type,
      },
      'User registered successfully',
    );

    return toUserResponse(user);
  }

  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      logger.warn(
        {
          event: SecurityEventType.RESOURCE_NOT_FOUND,
          userId,
          resource: 'user',
        },
        'User not found',
      );
      throw new NotFoundError('유저를 찾을 수 없습니다.');
    }

    return toUserResponse(user);
  }

  async updateMe(userId: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const { name, password, currentPassword, imageUrl } = dto;

    if (!name && !password && !imageUrl) {
      throw new BadRequestError('수정할 내용이 없습니다.');
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('유저를 찾을 수 없습니다.');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      logger.warn(
        {
          event: SecurityEventType.FORBIDDEN_ACCESS,
          userId,
          attemptedAction: 'update_password',
          reason: 'current_password_mismatch',
        },
        'Password update failed - incorrect current password',
      );
      throw new ForbiddenError('현재 비밀번호가 일치하지 않습니다.');
    }

    const updateData: { name?: string; password?: string; image?: string } = {};

    if (name) {
      updateData.name = name;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, Number(env.BCRYPT_ROUNDS));
    }

    if (imageUrl) {
      updateData.image = imageUrl;
    }

    const updatedUser = await this.userRepository.update(userId, updateData);

    if (password) {
      logger.info(
        {
          event: SecurityEventType.USER_PASSWORD_CHANGED,
          userId,
        },
        'User password changed successfully',
      );
    }

    const updatedFields = Object.keys(dto).filter(
      (k) =>
        k !== 'password' && k !== 'currentPassword' && dto[k as keyof UpdateUserDto] !== undefined,
    );

    logger.info(
      {
        event: SecurityEventType.USER_PROFILE_UPDATED,
        userId,
        updatedFields,
      },
      'User profile updated successfully',
    );

    return toUserResponse(updatedUser);
  }

  async getLikedStores(userId: string): Promise<StoreLikeResponseDto[]> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      logger.warn(
        {
          event: SecurityEventType.RESOURCE_NOT_FOUND,
          userId,
          resource: 'user',
        },
        'User not found for getLikedStores',
      );
      throw new NotFoundError('유저를 찾을 수 없습니다.');
    }

    const storeLikes = await this.userRepository.findLikedStores(userId);

    return storeLikes.map((like) => toStoreLikeResponse(like));
  }

  async deleteMe(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('유저를 찾을 수 없습니다.');
    }

    await this.userRepository.delete(userId);

    logger.info(
      {
        event: SecurityEventType.USER_DELETED,
        userId,
      },
      'User account deleted successfully',
    );
  }

  /**
   * 주문 완료 후 누적 구매 금액에 따른 등급 업데이트
   */
  async updateGradeByPurchase(userId: string): Promise<void> {
    // 1. 유저의 총 구매 금액 조회
    const totalAmount = await this.userRepository.getTotalPurchaseAmount(userId);

    // 2. 해당 금액에 맞는 등급 조회
    const grade = await this.userRepository.findGradeByAmount(totalAmount);

    if (!grade) {
      logger.warn(
        {
          event: SecurityEventType.RESOURCE_NOT_FOUND,
          userId,
          resource: 'grade',
          totalPurchaseAmount: totalAmount,
        },
        'No matching grade found for purchase amount',
      );
      return;
    }

    // 3. 유저의 현재 등급과 다르면 업데이트
    const user = await this.userRepository.findById(userId);

    if (user && user.gradeId !== grade.id) {
      const previousGradeId = user.gradeId;
      await this.userRepository.updateGrade(userId, grade.id);

      logger.info(
        {
          event: SecurityEventType.USER_GRADE_UPGRADED,
          userId,
          previousGradeId,
          newGradeId: grade.id,
          totalPurchaseAmount: totalAmount,
        },
        'User grade upgraded',
      );
    }
  }
}
