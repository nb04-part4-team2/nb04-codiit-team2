import type { UserType } from '@prisma/client';
import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import { env } from '@/config/constants.js';
import type { JwtPayload } from '@/common/types/jwt.types.js';

export interface AuthUser {
  id: string;
  type: UserType;
}

export const generateAccessToken = (userId: string, type: UserType): string => {
  return jwt.sign(
    { userId, type },
    env.ACCESS_TOKEN_SECRET as Secret,
    { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN } as SignOptions,
  );
};

export const generateRefreshToken = (userId: string, type: UserType): string => {
  return jwt.sign(
    { userId, type },
    env.REFRESH_TOKEN_SECRET as Secret,
    { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN } as SignOptions,
  );
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as JwtPayload;
};
