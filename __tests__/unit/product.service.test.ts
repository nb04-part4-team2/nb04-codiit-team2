import { jest } from '@jest/globals';
import { ProductService } from '@/domains/product/product.service.js';
import { ProductRepository } from '@/domains/product/product.repository.js';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import {
  createProductDetailMock,
  createProductSimpleMock,
  createProductInputMock,
  updateProductInputMock,
} from '../mocks/product.mock.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/common/utils/errors.js';

describe('ProductService 유닛 테스트', () => {
  let productService: ProductService;
  let productRepository: DeepMockProxy<ProductRepository>;

  // 테스트에 사용할 공통 변수
  const userId = 'user-id-1';
  const otherUserId = 'user-id-2';
  const storeId = 'store-id-1';
  const productId = 'product-id-1';

  beforeEach(() => {
    // Repository Mock 생성 및 의존성 주입
    productRepository = mockDeep<ProductRepository>();
    productService = new ProductService(productRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // 상품 생성 테스트
  describe('createProduct', () => {
    it('상품 생성 성공', async () => {
      // Arrange (준비)
      const input = createProductInputMock();
      const mockStore = { id: storeId };
      // Category ID를 number에서 string으로 변경
      const mockCategory = { id: 'category-id-1' };
      const createdProductSimple = createProductSimpleMock({ id: productId });
      const createdProductDetail = createProductDetailMock({ id: productId });

      productRepository.findStoreByUserId.mockResolvedValue(mockStore);
      productRepository.findCategoryByName.mockResolvedValue(mockCategory);
      productRepository.create.mockResolvedValue(createdProductSimple);
      // 생성 후 상세 조회까지 성공해야 함
      productRepository.findById.mockResolvedValue(createdProductDetail);

      // Act (실행)
      const result = await productService.createProduct(userId, input);

      // Assert (검증)
      expect(productRepository.findStoreByUserId).toHaveBeenCalledWith(userId);
      expect(productRepository.findCategoryByName).toHaveBeenCalledWith(input.categoryName);
      expect(productRepository.create).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(productId);
      expect(result.name).toBe(createdProductDetail.name);
    });

    it('스토어가 없으면 NotFoundError 발생', async () => {
      productRepository.findStoreByUserId.mockResolvedValue(null);

      await expect(productService.createProduct(userId, createProductInputMock())).rejects.toThrow(
        NotFoundError,
      );
    });

    it('카테고리가 없으면 NotFoundError 발생', async () => {
      productRepository.findStoreByUserId.mockResolvedValue({ id: storeId });
      productRepository.findCategoryByName.mockResolvedValue(null);

      await expect(productService.createProduct(userId, createProductInputMock())).rejects.toThrow(
        NotFoundError,
      );
    });

    it('중복된 사이즈 재고가 있으면 BadRequestError 발생', async () => {
      productRepository.findStoreByUserId.mockResolvedValue({ id: storeId });
      // Category ID 타입 일치 (string)
      productRepository.findCategoryByName.mockResolvedValue({ id: 'category-id-1' });

      const invalidInput = createProductInputMock({
        stocks: [
          { sizeId: 1, quantity: 10 },
          { sizeId: 1, quantity: 5 }, // sizeId 1 중복
        ],
      });

      await expect(productService.createProduct(userId, invalidInput)).rejects.toThrow(
        BadRequestError,
      );
    });
  });

  // 상품 상세 조회 테스트
  describe('getProduct', () => {
    it('상품 상세 조회 성공', async () => {
      const mockProduct = createProductDetailMock({ id: productId });
      productRepository.findById.mockResolvedValue(mockProduct);

      const result = await productService.getProduct(productId);

      expect(productRepository.findById).toHaveBeenCalledWith(productId);
      expect(result.id).toBe(productId);
    });

    it('상품이 존재하지 않으면 NotFoundError 발생', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(productService.getProduct(productId)).rejects.toThrow(NotFoundError);
    });
  });

  // 상품 목록 조회 테스트
  describe('getProducts', () => {
    it('상품 목록 조회 성공', async () => {
      const mockList = [
        createProductDetailMock({ id: 'p1' }),
        createProductDetailMock({ id: 'p2' }),
      ];

      // Repository는 { products, totalCount } 형태를 반환
      productRepository.findAll.mockResolvedValue({
        products: mockList,
        totalCount: 2,
      });

      // sort 필드 추가 (ProductListQueryDto 필수값 대응)
      // Service의 getProducts가 호출될 때 Repository의 findAll이 호출되는지 확인
      const queryDto = { page: 1, pageSize: 10, sort: 'recent' as const };

      const result = await productService.getProducts(queryDto);

      expect(productRepository.findAll).toHaveBeenCalledWith(queryDto);
      expect(result.list).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });
  });

  // 상품 수정 테스트
  describe('updateProduct', () => {
    it('상품 수정 성공', async () => {
      // Arrange
      const input = updateProductInputMock({ name: '수정된 이름' });

      // 소유권 확인 Mock (내 스토어의 상품)
      const ownershipMock = {
        id: productId,
        storeId,
        store: { id: storeId, userId: userId }, // 요청자와 소유자 일치
      };

      const updatedProduct = createProductDetailMock({
        id: productId,
        name: '수정된 이름',
      });

      productRepository.findProductOwnership.mockResolvedValue(ownershipMock);
      productRepository.update.mockResolvedValue(updatedProduct);

      // Act
      const result = await productService.updateProduct(userId, productId, input);

      // Assert
      expect(productRepository.findProductOwnership).toHaveBeenCalledWith(productId);
      expect(productRepository.update).toHaveBeenCalled();
      expect(result.name).toBe('수정된 이름');
    });

    it('본인 스토어 상품이 아니면 ForbiddenError 발생', async () => {
      // 소유권 확인 Mock (다른 사람의 스토어)
      const ownershipMock = {
        id: productId,
        storeId,
        store: { id: storeId, userId: otherUserId }, // 요청자와 소유자 불일치
      };
      productRepository.findProductOwnership.mockResolvedValue(ownershipMock);

      await expect(
        productService.updateProduct(userId, productId, updateProductInputMock()),
      ).rejects.toThrow(ForbiddenError);
    });

    it('상품이 존재하지 않으면 NotFoundError 발생', async () => {
      productRepository.findProductOwnership.mockResolvedValue(null);

      await expect(
        productService.updateProduct(userId, productId, updateProductInputMock()),
      ).rejects.toThrow(NotFoundError);
    });

    it('카테고리 변경 시 존재하지 않는 카테고리면 NotFoundError 발생', async () => {
      const ownershipMock = {
        id: productId,
        storeId,
        store: { id: storeId, userId: userId },
      };
      productRepository.findProductOwnership.mockResolvedValue(ownershipMock);

      // 카테고리 조회 시 null 반환
      productRepository.findCategoryByName.mockResolvedValue(null);

      const inputWithInvalidCategory = updateProductInputMock({
        categoryName: '없는카테고리',
      });

      await expect(
        productService.updateProduct(userId, productId, inputWithInvalidCategory),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // 상품 삭제 테스트
  describe('deleteProduct', () => {
    it('상품 삭제 성공', async () => {
      // Arrange
      const ownershipMock = {
        id: productId,
        storeId,
        store: { id: storeId, userId: userId },
      };
      productRepository.findProductOwnership.mockResolvedValue(ownershipMock);

      // Act
      await productService.deleteProduct(userId, productId);

      // Assert
      expect(productRepository.delete).toHaveBeenCalledWith(productId);
    });

    it('상품이 없으면 NotFoundError 발생', async () => {
      productRepository.findProductOwnership.mockResolvedValue(null);

      await expect(productService.deleteProduct(userId, productId)).rejects.toThrow(NotFoundError);
    });

    it('권한이 없으면 ForbiddenError 발생', async () => {
      const ownershipMock = {
        id: productId,
        storeId,
        store: { id: storeId, userId: otherUserId },
      };
      productRepository.findProductOwnership.mockResolvedValue(ownershipMock);

      await expect(productService.deleteProduct(userId, productId)).rejects.toThrow(ForbiddenError);
    });
  });
});
