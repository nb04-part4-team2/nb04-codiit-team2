import bcrypt from 'bcrypt';
import { env } from '@/config/constants.js';
import { CreateUserDto, UpdateUserDto } from './user.schema.js';
import { UserRepository } from './user.repository.js';
import type { UserResponseDto, StoreLikeResponseDto } from './user.dto.js';
import { toUserResponse, toStoreLikeResponse } from './user.mapper.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '@/common/utils/errors.js';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    const { name, email, password, type } = dto;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
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

    return toUserResponse(user);
  }

  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
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
      throw new UnauthorizedError('현재 비밀번호가 일치하지 않습니다.');
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

    return toUserResponse(updatedUser);
  }

  async getLikedStores(userId: string): Promise<StoreLikeResponseDto[]> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
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
      return;
    }

    // 3. 유저의 현재 등급과 다르면 업데이트
    const user = await this.userRepository.findById(userId);

    if (user && user.gradeId !== grade.id) {
      await this.userRepository.updateGrade(userId, grade.id);
    }
  }
}
