import type { UserType } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  type: UserType;
}
