import { UserType } from '@prisma/client';
import * as z from 'zod';

export const getCartUserSchema = z.object({
  userId: z.cuid({ message: '올바르지 않은 userId 형식입니다.' }),
  userType: z.enum(UserType, { message: '올바르지 않은 유저 타입입니다.' }),
});
