import { jest } from '@jest/globals';
import { StoreRepository } from '../../src/domains/store/store.repository.js';
import { StoreService } from '../../src/domains/store/store.service.js';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { createStoreMock, createStoreInputMock } from '../mocks/store.mock.js';

describe('StoreService 유닛 테스트', () => {
  let storeService: StoreService;
  let storeRepository: DeepMockProxy<StoreRepository>;

  const userId = 'user-id-1';

  // 테스트 케이스가 실행되기 전에 매번 실행
  beforeEach(() => {
    // 의존성 주입
    storeRepository = mockDeep<StoreRepository>();
    storeService = new StoreService(storeRepository);
  });

  // 각 테스트가 끝난 후 모든 모의(mock)를 원래대로 복원
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  // 스토어 생성
  describe('createStore', () => {
    it('스토어 생성 성공', async () => {
      // --- 준비 (Arrange) ---
      const inputData = createStoreInputMock();
      const expectedStore = createStoreMock({ userId });

      storeRepository.findByUserId.mockResolvedValue(null); // 기존 스토어 없음
      storeRepository.create.mockResolvedValue(expectedStore);

      // --- 실행 (Act) ---
      const result = await storeService.createStore(userId, inputData);

      // --- 검증 (Assert) ---
      expect(storeRepository.findByUserId).toHaveBeenCalledTimes(1);
      expect(storeRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(storeRepository.create).toHaveBeenCalledTimes(1);
      expect(storeRepository.create).toHaveBeenCalledWith({
        ...inputData,
        user: { connect: { id: userId } },
      });
      expect(result).toEqual(expectedStore);
      expect(result.name).toBe('테스트 스토어');
    });

    it('이미 스토어를 보유한 경우 ConflictError 발생', async () => {
      // --- 준비 (Arrange) ---
      const inputData = createStoreInputMock();
      const existingStore = createStoreMock({
        id: 'existing-store-id',
        name: '기존 스토어',
        userId,
      });

      storeRepository.findByUserId.mockResolvedValue(existingStore);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(storeService.createStore(userId, inputData)).rejects.toThrow(
        '이미 스토어를 보유하고 있습니다.',
      );

      // create가 호출되지 않았는지 확인
      expect(storeRepository.findByUserId).toHaveBeenCalledTimes(1);
      expect(storeRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(storeRepository.create).not.toHaveBeenCalled();
    });
  });
});
