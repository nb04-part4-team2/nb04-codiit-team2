import bcrypt from 'bcrypt';
import { env } from '@/config/constants.js';
import { CreateUserDto } from '@/domains/user/user.schema.js';
import { UserRepository } from '@/domains/user/user.repository.js';
import type { UserResponseDto, UserWithGrade } from '@/domains/user/user.dto.js';
import { ConflictError } from '@/common/utils/errors.js';

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
