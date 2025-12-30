import type { LoginDto } from '@/domains/auth/auth.schema.js';

// ============================================
// LoginDto Mock (로그인 요청 DTO)
// ============================================
export const createLoginInputMock = (overrides: Partial<LoginDto> = {}): LoginDto => ({
  email: 'test@example.com',
  password: 'test1234',
  ...overrides,
});

// ============================================
// Login Response Mock (로그인 응답)
// ============================================
export const createLoginResponseMock = (overrides: Partial<LoginResponseMock> = {}) => ({
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: {
    id: 'user-id-1',
    email: 'test@example.com',
    name: '테스트 유저',
    type: 'BUYER' as const,
    point: 0,
    image: null,
    grade: {
      id: 'grade_green',
      name: 'green',
      rate: 5,
      minAmount: 0,
    },
    ...overrides.user,
  },
  ...overrides,
});

interface LoginResponseMock {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    type: 'BUYER' | 'SELLER';
    point: number;
    image: string | null;
    grade: {
      id: string;
      name: string;
      rate: number;
      minAmount: number;
    };
  };
}

// ============================================
// Refresh Response Mock (토큰 갱신 응답)
// ============================================
export const createRefreshResponseMock = (overrides: { accessToken?: string } = {}) => ({
  accessToken: 'new-mock-access-token',
  ...overrides,
});
