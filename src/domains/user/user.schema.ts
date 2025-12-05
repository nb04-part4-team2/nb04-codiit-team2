import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.'),
  email: z.string().email('유효한 이메일을 입력해주세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
  type: z.enum(['BUYER', 'SELLER']),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
