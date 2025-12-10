import bcrypt from 'bcrypt';
import { env } from '@/config/constants.js';
import { CreateUserDto, UpdateUserDto } from './user.schema.js';
import { UserRepository } from './user.repository.js';
import type { UserResponseDto, UserWithGrade } from './user.dto.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '@/common/utils/errors.js';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

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

    return this.toUserResponse(user);
  }

  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('유저를 찾을 수 없습니다.');
    }

    return this.toUserResponse(user);
  }

  async updateMe(userId: string, dto: UpdateUserDto, imageUrl?: string): Promise<UserResponseDto> {
    const { name, password, currentPassword } = dto;

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

    return this.toUserResponse(updatedUser);
  }

  private toUserResponse(user: UserWithGrade): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      point: user.point,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      grade: {
        id: user.grade.id,
        name: user.grade.name,
        rate: user.grade.rate,
        minAmount: user.grade.minAmount,
      },
      image: user.image,
    };
  }
}
