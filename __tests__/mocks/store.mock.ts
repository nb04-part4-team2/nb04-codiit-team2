import type { Store, StoreLike } from '@prisma/client';
import type { CreateStoreBody, UpdateStoreBody } from '../../src/domains/store/store.schema.js';

/**
 * Store Mock 데이터 생성 팩토리
 * Unit Test에서 Repository mock 반환값으로 사용
 */
export const createStoreMock = (overrides: Partial<Store> = {}): Store => ({
  id: 'store-id-1',
  name: '테스트 스토어',
  address: '서울시 강남구',
  phoneNumber: '010-1234-5678',
  content: '테스트 스토어 설명입니다.',
  detailAddress: null,
  image: null,
  userId: 'user-id-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * 스토어 생성 입력 데이터 (API 요청 body)
 * src/domains/store/store.schema.ts의 CreateStoreBody 타입 사용
 */
export const createStoreInputMock = (
  overrides: Partial<CreateStoreBody> = {},
): CreateStoreBody => ({
  name: '테스트 스토어',
  address: '서울시 강남구',
  phoneNumber: '010-1234-5678',
  content: '테스트 스토어 설명입니다.',
  ...overrides,
});

/**
 * 스토어 수정 입력 데이터 (API 요청 body)
 * src/domains/store/store.schema.ts의 UpdateStoreBody 타입 사용
 */
export const updateStoreInputMock = (
  overrides: Partial<UpdateStoreBody> = {},
): UpdateStoreBody => ({
  name: '수정된 스토어',
  ...overrides,
});

/**
 * StoreLike Mock 데이터 생성 팩토리
 * Unit Test에서 관심 스토어 관련 Repository mock 반환값으로 사용
 */
export const createStoreLikeMock = (overrides: Partial<StoreLike> = {}): StoreLike => ({
  id: 'store-like-id-1',
  userId: 'user-id-1',
  storeId: 'store-id-1',
  createdAt: new Date(),
  ...overrides,
});
