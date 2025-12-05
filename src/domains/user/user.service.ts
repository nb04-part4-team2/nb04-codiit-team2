import bcrypt from 'bcrypt';
import { env } from '@/config/constants.js';
import { CreateUserDto } from './user.schema.js';
import { UserRepository } from './user.repository.js';
import type { UserResponseDto, UserWithGrade } from './user.dto.js';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    const { name, email, password, type } = dto;

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
