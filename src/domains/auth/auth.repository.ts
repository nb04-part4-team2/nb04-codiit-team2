import prisma from '@/config/prisma.js';

interface CreateRefreshTokenData {
  token: string; // 해시된 토큰
  userId: string;
  expiresAt: Date;
}

export class AuthRepository {
  // 토큰 저장
  async createRefreshToken(data: CreateRefreshTokenData) {
    return prisma.refreshToken.create({
      data,
    });
  }

  // 토큰 조회 (해시값으로)
  async findByToken(hashedToken: string) {
    return prisma.refreshToken.findUnique({
      where: { token: hashedToken },
    });
  }

  // 토큰 삭제 (단일) - 로그아웃 시 사용
  async deleteByToken(hashedToken: string) {
    return prisma.refreshToken.deleteMany({
      where: { token: hashedToken },
    });
  }

  // 사용자의 모든 토큰 삭제 - 비밀번호 변경 시 사용
  async deleteAllByUserId(userId: string) {
    return prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  // 만료된 토큰 정리 (배치 작업용)
  async deleteExpiredTokens() {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }
}
