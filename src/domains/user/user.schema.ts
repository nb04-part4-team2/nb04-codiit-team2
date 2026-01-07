import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해주세요.'),
  email: z.string().trim().email('유효한 이메일을 입력해주세요.'),
  password: z.string().trim().min(8, '비밀번호는 8자 이상이어야 합니다.'),
  type: z.enum(['BUYER', 'SELLER']),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해주세요.').optional(),
  password: z.string().trim().min(8, '비밀번호는 8자 이상이어야 합니다.').optional(),
  currentPassword: z.string().trim().min(1, '현재 비밀번호를 입력해주세요.'),
  imageUrl: z.string().url().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
