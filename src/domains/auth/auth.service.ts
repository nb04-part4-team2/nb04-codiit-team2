import crypto from 'crypto';
import bcrypt from 'bcrypt';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@/common/utils/jwt.util.js';
import { UnauthorizedError } from '@/common/utils/errors.js';
import { loginSchema } from './auth.schema.js';
import { UserRepository } from '@/domains/user/user.repository.js';
import { AuthRepository } from './auth.repository.js';

// 토큰 해싱 함수
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// 7일을 밀리초로 변환
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private authRepository: AuthRepository,
  ) {}

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

    // 리프레시 토큰을 해시하여 DB에 저장
    const hashedToken = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);

    await this.authRepository.createRefreshToken({
      token: hashedToken,
      userId: user.id,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        point: user.point,
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
    // 1. DB에서 해시된 토큰 조회
    const hashedToken = hashToken(refreshToken);
    const storedToken = await this.authRepository.findByToken(hashedToken);

    // 2. 토큰이 없으면 에러 (무효화된 토큰)
    if (!storedToken) {
      throw new UnauthorizedError('유효하지 않은 토큰입니다.');
    }

    // 3. 만료 시간 확인
    if (storedToken.expiresAt < new Date()) {
      await this.authRepository.deleteByToken(hashedToken);
      throw new UnauthorizedError('토큰이 만료되었습니다.');
    }

    // 4. JWT 검증
    const payload = verifyRefreshToken(refreshToken);
    const user = await this.userRepository.findById(payload.userId);

    if (!user) {
      throw new UnauthorizedError('사용자를 찾을 수 없습니다.');
    }

    // 5. 새 액세스 토큰 발급
    const newAccessToken = generateAccessToken(user.id, user.type);
    return { accessToken: newAccessToken };
  }

  async logout(refreshToken: string) {
    // DB에서 해당 토큰 삭제
    const hashedToken = hashToken(refreshToken);
    await this.authRepository.deleteByToken(hashedToken);

    return { message: '로그아웃 되었습니다.' };
  }
}
