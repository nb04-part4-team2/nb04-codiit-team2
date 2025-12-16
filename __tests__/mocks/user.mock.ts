import type { User, Grade, StoreLike, Store } from '@prisma/client';
import type { CreateUserDto, UpdateUserDto } from '../../src/domains/user/user.schema.js';
import type { UserWithGrade } from '../../src/domains/user/user.dto.js';
import type { JwtPayload } from '../../src/common/utils/jwt.util.js';
import { toUserResponse, toStoreLikeResponse } from '../../src/domains/user/user.mapper.js';

// ============================================
// 공통 날짜
// ============================================
const now = new Date();

// ============================================
// Grade Mock (Raw DB 형태)
// ============================================
export const createGradeMock = (overrides: Partial<Grade> = {}): Grade => ({
  id: 'grade_green',
  name: 'green',
  minAmount: 0,
  rate: 5,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

// ============================================
// Raw User Mock (Prisma 모델 기반)
// ============================================
export const createUserMock = (overrides: Partial<User> = {}): User => ({
  id: 'user-id-1',
  name: '테스트 유저',
  email: 'test@example.com',
  password: 'hashed-password',
  type: 'BUYER',
  point: 0,
  image: null,
  createdAt: now,
  updatedAt: now,
  gradeId: 'grade_green',
  ...overrides,
});

// ============================================
// UserWithGrade Mock (Repository 반환 형태)
// ============================================
export const createUserWithGradeMock = (overrides: Partial<UserWithGrade> = {}): UserWithGrade => ({
  id: 'user-id-1',
  name: '테스트 유저',
  email: 'test@example.com',
  type: 'BUYER',
  point: 0,
  image: null,
  createdAt: now,
  updatedAt: now,
  grade: {
    id: 'grade_green',
    name: 'green',
    rate: 5,
    minAmount: 0,
    ...(overrides.grade || {}),
  },
  ...overrides,
});

// ============================================
// Response Mock (mapper 기반)
// Raw → Mapper → ResponseDto
// ============================================
export const createUserResponseMock = (overrides: Partial<UserWithGrade> = {}) => {
  const raw = createUserWithGradeMock(overrides);
  return toUserResponse(raw);
};

// ============================================
// StoreLike Raw Mock (UserRepository.findLikedStores 용)
// ============================================
export const createStoreLikeRawMock = (
  overrides: Partial<StoreLike & { store: Store }> = {},
): StoreLike & { store: Store } => ({
  id: 'store-like-id-1',
  userId: 'user-id-1',
  storeId: 'store-id-1',
  createdAt: now,
  store: {
    id: 'store-id-1',
    name: '테스트 스토어',
    address: '서울시 강남구',
    phoneNumber: '010-1234-5678',
    content: '스토어 설명',
    image: null,
    createdAt: now,
    updatedAt: now,
    detailAddress: null,
    userId: 'seller-id-1',
    ...overrides.store,
  },
  ...overrides,
});

// ============================================
// StoreLikeResponse Mock (mapper 기반)
// Raw → Mapper → Response DTO
// ============================================
export const createStoreLikeResponseMock = (
  overrides: Partial<StoreLike & { store: Store }> = {},
) => {
  const raw = createStoreLikeRawMock(overrides);
  return toStoreLikeResponse(raw);
};

// ============================================
// CreateUserDto mock (회원가입 DTO)
// ============================================
export const createUserInputMock = (overrides: Partial<CreateUserDto> = {}): CreateUserDto => ({
  name: '테스트 유저',
  email: 'test@example.com',
  password: 'test1234',
  type: 'BUYER',
  ...overrides,
});

// ============================================
// UpdateUserDto mock (내 정보 수정 DTO)
// ============================================
export const updateUserInputMock = (overrides: Partial<UpdateUserDto> = {}): UpdateUserDto => ({
  name: '변경된 유저',
  currentPassword: 'current1234',
  password: undefined,
  ...overrides,
});

// ============================================
// Auth 미들웨어 테스트용 JWT Payload mock
// ============================================
export const createJwtPayloadMock = (overrides: Partial<JwtPayload> = {}) => ({
  userId: 'user-id-1',
  type: 'BUYER',
  ...overrides,
});
