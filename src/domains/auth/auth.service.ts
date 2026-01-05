import bcrypt from 'bcrypt';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@/common/utils/jwt.util.js';
import { UnauthorizedError } from '@/common/utils/errors.js';
import { loginSchema } from './auth.schema.js';
import { UserRepository } from '@/domains/user/user.repository.js';

export class AuthService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async login(dto: unknown) {
    const { email, password } = loginSchema.parse(dto);

    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedError('이메일 또는 비밀번호가 일치하지 않습니다.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('이메일 또는 비밀번호가 일치하지 않습니다.');
    }

    const accessToken = generateAccessToken(user.id, user.type);
    const refreshToken = generateRefreshToken(user.id, user.type);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        points: user.point,
        image: user.image,
        grade: {
          id: user.grade.id,
          name: user.grade.name,
          rate: user.grade.rate * 100,
          minAmount: user.grade.minAmount,
        },
      },
    };
  }

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const user = await this.userRepository.findById(payload.userId);

    if (!user) {
      throw new UnauthorizedError('사용자를 찾을 수 없습니다.');
    }

    const newAccessToken = generateAccessToken(user.id, user.type);
    return { accessToken: newAccessToken };
  }

  async logout() {
    return { message: '로그아웃 되었습니다.' };
  }
}
