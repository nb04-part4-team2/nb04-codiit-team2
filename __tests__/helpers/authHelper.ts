import type { UserType } from '@prisma/client';
import { generateAccessToken } from '../../src/common/utils/jwt.util.js';

/**
 * 테스트용 Access Token 생성
 * 실제 앱의 generateAccessToken을 사용하여 일관성 유지
 */
export const generateTestToken = (userId: string, type: UserType = 'BUYER'): string => {
  return generateAccessToken(userId, type);
};

/**
 * 테스트용 판매자 토큰 생성 (편의 함수)
 */
export const generateSellerToken = (userId: string): string => {
  return generateAccessToken(userId, 'SELLER');
};

/**
 * 테스트용 구매자 토큰 생성 (편의 함수)
 */
export const generateBuyerToken = (userId: string): string => {
  return generateAccessToken(userId, 'BUYER');
};
