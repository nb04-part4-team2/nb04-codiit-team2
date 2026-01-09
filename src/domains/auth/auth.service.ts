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
import { env } from '@/config/constants.js';
import { logger } from '@/config/logger.js';
import { SecurityEventType } from '@/common/types/security-events.type.js';
import { measureDuration } from '@/common/utils/logger-helpers.js';

// 토큰 해싱 함수
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private authRepository: AuthRepository,
  ) {}

  async login(dto: unknown) {
    const { email, password } = loginSchema.parse(dto);

    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      logger.warn(
        {
          event: SecurityEventType.AUTHENTICATION_FAILURE,
          email,
          reason: 'user_not_found',
        },
        'Login failed - user not found',
      );
      throw new UnauthorizedError('이메일 또는 비밀번호가 일치하지 않습니다.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      logger.warn(
        {
          event: SecurityEventType.AUTHENTICATION_FAILURE,
          userId: user.id,
          email: user.email,
          reason: 'invalid_password',
        },
        'Login failed - invalid password',
      );
      throw new UnauthorizedError('이메일 또는 비밀번호가 일치하지 않습니다.');
    }

    const accessToken = generateAccessToken(user.id, user.type);
    const refreshToken = generateRefreshToken(user.id, user.type);

    // 리프레시 토큰을 해시하여 DB에 저장
    const hashedToken = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_MS);

    // jti 추출
    const payload = verifyRefreshToken(refreshToken);

    await this.authRepository.createRefreshToken({
      token: hashedToken,
      jti: payload.jti!,
      userId: user.id,
      expiresAt,
    });

    logger.info(
      {
        event: SecurityEventType.AUTHENTICATION_SUCCESS,
        userId: user.id,
        email: user.email,
        userType: user.type,
      },
      'User logged in successfully',
    );

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
    // 1. DB에서 해시된 토큰 조회
    const hashedToken = hashToken(refreshToken);
    const storedToken = await this.authRepository.findByToken(hashedToken);

    // 2. 토큰이 없으면 에러 (무효화된 토큰)
    if (!storedToken) {
      logger.warn(
        {
          event: SecurityEventType.TOKEN_INVALID,
          resource: 'refreshToken',
        },
        'Refresh token not found or invalid',
      );
      throw new UnauthorizedError('유효하지 않은 토큰입니다.');
    }

    // 3. 만료 시간 확인
    if (storedToken.expiresAt < new Date()) {
      await this.authRepository.deleteByToken(hashedToken);
      logger.warn(
        {
          event: SecurityEventType.TOKEN_EXPIRED,
          userId: storedToken.userId,
        },
        'Refresh token has expired',
      );
      throw new UnauthorizedError('토큰이 만료되었습니다.');
    }

    // 4. JWT 검증
    const payload = verifyRefreshToken(refreshToken);
    const user = await this.userRepository.findById(payload.userId);

    if (!user) {
      logger.warn(
        {
          event: SecurityEventType.RESOURCE_NOT_FOUND,
          userId: payload.userId,
          resource: 'user',
        },
        'User not found after token validation',
      );
      throw new UnauthorizedError('사용자를 찾을 수 없습니다.');
    }

    // 5. 새 액세스 토큰 + 새 리프레시 토큰 발급
    const newAccessToken = generateAccessToken(user.id, user.type);
    const newRefreshToken = generateRefreshToken(user.id, user.type);

    // 6. 새 토큰의 jti 추출
    const newPayload = verifyRefreshToken(newRefreshToken);
    const newHashedToken = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_MS);

    // 7. Rotation: 기존 토큰 삭제 + 새 토큰 저장 (원자적)
    const startTime = Date.now();

    await this.authRepository.rotateRefreshToken(user.id, {
      token: newHashedToken,
      jti: newPayload.jti!,
      userId: user.id,
      expiresAt,
    });

    const durationMs = measureDuration(startTime);

    logger.info(
      {
        event: SecurityEventType.TOKEN_REFRESH_SUCCESS,
        userId: user.id,
        durationMs,
      },
      `Refresh token rotated successfully in ${durationMs}ms`,
    );

    // 8. 새 리프레시 토큰도 함께 반환
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string, userId: string) {
    // DB에서 해당 토큰 삭제
    const hashedToken = hashToken(refreshToken);
    await this.authRepository.deleteByToken(hashedToken);

    logger.info(
      {
        event: SecurityEventType.LOGOUT_SUCCESS,
        userId,
      },
      'User logged out successfully',
    );

    return { message: '로그아웃 되었습니다.' };
  }
}
