import { jest } from '@jest/globals';
import { StoreRepository } from '../../src/domains/store/store.repository.js';
import { StoreService } from '../../src/domains/store/store.service.js';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { createStoreMock, createStoreInputMock } from '../mocks/store.mock.js';
import { NotFoundError } from '../../src/common/utils/errors.js';

describe('StoreService 유닛 테스트', () => {
  let storeService: StoreService;
  let storeRepository: DeepMockProxy<StoreRepository>;

  const userId = 'user-id-1';
  const storeId = 'store-id-1';

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

  // 스토어 상세 조회 (공개)
  describe('getStoreDetail', () => {
    it('스토어 상세 조회 성공', async () => {
      // --- 준비 (Arrange) ---
      const store = createStoreMock({ id: storeId });
      const favoriteCount = 10;

      storeRepository.findById.mockResolvedValue(store);
      storeRepository.countFavorites.mockResolvedValue(favoriteCount);

      // --- 실행 (Act) ---
      const result = await storeService.getStoreDetail(storeId);

      // --- 검증 (Assert) ---
      expect(storeRepository.findById).toHaveBeenCalledWith(storeId);
      expect(storeRepository.countFavorites).toHaveBeenCalledWith(storeId);
      expect(result.store).toEqual(store);
      expect(result.favoriteCount).toBe(favoriteCount);
    });

    it('스토어가 존재하지 않으면 NotFoundError 발생', async () => {
      // --- 준비 (Arrange) ---
      storeRepository.findById.mockResolvedValue(null);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(storeService.getStoreDetail(storeId)).rejects.toThrow(NotFoundError);
      expect(storeRepository.countFavorites).not.toHaveBeenCalled();
    });
  });

  // 내 스토어 상세 조회
  describe('getMyStoreDetail', () => {
    it('내 스토어 상세 조회 성공', async () => {
      // --- 준비 (Arrange) ---
      const store = createStoreMock({ id: storeId, userId });

      storeRepository.findByUserId.mockResolvedValue(store);
      storeRepository.countProducts.mockResolvedValue(5);
      storeRepository.countFavorites.mockResolvedValue(10);
      storeRepository.countMonthFavorites.mockResolvedValue(3);
      storeRepository.getTotalSoldCount.mockResolvedValue(100);

      // --- 실행 (Act) ---
      const result = await storeService.getMyStoreDetail(userId);

      // --- 검증 (Assert) ---
      expect(storeRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result.store).toEqual(store);
      expect(result.stats).toEqual({
        productCount: 5,
        favoriteCount: 10,
        monthFavoriteCount: 3,
        totalSoldCount: 100,
      });
    });

    it('스토어가 존재하지 않으면 NotFoundError 발생', async () => {
      // --- 준비 (Arrange) ---
      storeRepository.findByUserId.mockResolvedValue(null);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(storeService.getMyStoreDetail(userId)).rejects.toThrow(NotFoundError);
    });
  });

  // 내 스토어 상품 목록 조회
  describe('getMyStoreProducts', () => {
    it('내 스토어 상품 목록 조회 성공', async () => {
      // --- 준비 (Arrange) ---
      const store = createStoreMock({ id: storeId, userId });
      const mockProducts = [
        {
          id: 'product-1',
          image: 'image1.jpg',
          name: '상품1',
          price: 10000,
          isSoldOut: false,
          discountRate: 0,
          discountStartTime: null,
          discountEndTime: null,
          createdAt: new Date(),
          stocks: [{ quantity: 5 }, { quantity: 3 }],
        },
      ];

      storeRepository.findByUserId.mockResolvedValue(store);
      storeRepository.findProductsWithStock.mockResolvedValue(mockProducts);
      storeRepository.countProducts.mockResolvedValue(1);

      // --- 실행 (Act) ---
      const result = await storeService.getMyStoreProducts(userId, { page: 1, pageSize: 10 });

      // --- 검증 (Assert) ---
      expect(storeRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(storeRepository.findProductsWithStock).toHaveBeenCalledWith(storeId, 0, 10);
      expect(result.totalCount).toBe(1);
      expect(result.products).toHaveLength(1);
      expect(result.products[0].stock).toBe(8); // 5 + 3
      expect(result.products[0].isDiscount).toBe(false);
    });

    it('스토어가 존재하지 않으면 NotFoundError 발생', async () => {
      // --- 준비 (Arrange) ---
      storeRepository.findByUserId.mockResolvedValue(null);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(storeService.getMyStoreProducts(userId, {})).rejects.toThrow(NotFoundError);
    });

    it('할인 중인 상품 isDiscount가 true', async () => {
      // --- 준비 (Arrange) ---
      const store = createStoreMock({ id: storeId, userId });
      const now = new Date();
      const mockProducts = [
        {
          id: 'product-1',
          image: 'image1.jpg',
          name: '할인 상품',
          price: 10000,
          isSoldOut: false,
          discountRate: 20,
          discountStartTime: new Date(now.getTime() - 1000 * 60 * 60), // 1시간 전
          discountEndTime: new Date(now.getTime() + 1000 * 60 * 60), // 1시간 후
          createdAt: new Date(),
          stocks: [{ quantity: 10 }],
        },
      ];

      storeRepository.findByUserId.mockResolvedValue(store);
      storeRepository.findProductsWithStock.mockResolvedValue(mockProducts);
      storeRepository.countProducts.mockResolvedValue(1);

      // --- 실행 (Act) ---
      const result = await storeService.getMyStoreProducts(userId, {});

      // --- 검증 (Assert) ---
      expect(result.products[0].isDiscount).toBe(true);
    });
  });
});
