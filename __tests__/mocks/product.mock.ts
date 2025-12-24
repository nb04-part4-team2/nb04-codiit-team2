import {
  ProductDetailWithRelations,
  ProductWithRelations,
} from '@/domains/product/product.repository.js';
import { CreateProductDto, UpdateProductDto } from '@/domains/product/product.dto.js';

/**
 * Product Repository 조회 결과 (Detail) Mock
 * - Prisma 조회 결과인 ProductDetailWithRelations 타입을 흉내냅니다.
 * - as unknown as 구문을 사용하여 타입 에러를 방지합니다.
 */
export const createProductDetailMock = (
  overrides: Partial<ProductDetailWithRelations> = {},
): ProductDetailWithRelations => {
  const defaultProduct = {
    id: 'product-id-1',
    storeId: 'store-id-1',
    categoryId: 1, // 프로젝트 설정에 따라 number 또는 string
    name: '테스트 상품',
    price: 10000,
    content: '테스트 상품 설명',
    image: 'https://test.com/image.jpg',
    discountRate: 0,
    discountStartTime: null,
    discountEndTime: null,
    salesCount: 0,
    reviewsCount: 0,
    reviewsRating: 0,
    isSoldOut: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    store: { id: 'store-id-1', name: '테스트 스토어', userId: 'user-id-1' }, // userId 추가 (권한 검증용)
    category: { id: 1, name: 'TOP' },
    stocks: [
      {
        id: 'stock-id-1',
        productId: 'product-id-1',
        sizeId: 1,
        quantity: 10,
        size: { id: 1, en: 'L', ko: '라지' },
      },
    ],
    inquiries: [],
    reviews: [],
  };

  // 강제 형변환을 통해 Partial 타입과 필수 타입 간의 충돌 해결
  return { ...defaultProduct, ...overrides } as unknown as ProductDetailWithRelations;
};

/**
 * Product Repository 생성 결과 (Simple) Mock
 * - 목록 조회 등 관계 데이터가 적은 경우 사용됩니다.
 */
export const createProductSimpleMock = (
  overrides: Partial<ProductWithRelations> = {},
): ProductWithRelations => {
  return createProductDetailMock(overrides) as unknown as ProductWithRelations;
};

/**
 * 상품 생성 요청 DTO Mock
 */
export const createProductInputMock = (
  overrides: Partial<CreateProductDto> = {},
): CreateProductDto => {
  const defaultData = {
    name: '새 상품',
    price: 20000,
    content: '새 상품 상세',
    image: 'https://test.com/new.jpg',
    discountRate: 0,
    discountStartTime: null, // DTO가 string을 받는지 Date를 받는지에 따라 '2025-01-01' 등의 문자열 사용 가능
    discountEndTime: null,
    categoryName: 'TOP',
    stocks: [{ sizeId: 1, quantity: 100 }],
  };

  return { ...defaultData, ...overrides } as unknown as CreateProductDto;
};

/**
 * 상품 수정 요청 DTO Mock
 * - UpdateProductDto에 id 필드가 필수인 경우를 대비해 기본값에 id를 포함합니다.
 */
export const updateProductInputMock = (
  overrides: Partial<UpdateProductDto> = {},
): UpdateProductDto => {
  const defaultData = {
    id: 'product-id-1', // DTO 정의에 id가 있다면 필수값일 수 있음
    name: '수정된 상품',
    price: 30000,
    content: '수정된 상세 내용',
    image: 'https://test.com/updated.jpg',
    discountRate: 10,
    discountStartTime: null,
    discountEndTime: null,
    categoryName: 'TOP',
    isSoldOut: false,
    stocks: [{ sizeId: 1, quantity: 50 }],
  };

  return { ...defaultData, ...overrides } as unknown as UpdateProductDto;
};
