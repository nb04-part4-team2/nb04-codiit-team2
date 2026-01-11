import {
  ProductDetailWithRelations,
  ProductWithRelations,
} from '@/domains/product/product.repository.js';
import { CreateProductDto, UpdateProductDto } from '@/domains/product/product.dto.js';

/**
 * Product Repository 조회 결과 (Detail) Mock
 * - Prisma 조회 결과인 ProductDetailWithRelations 타입에 맞춰 필수 필드를 정의합니다.
 * - deletedAt, store.userId 등 타입 정의에 없는 필드는 제외했습니다.
 */
export const createProductDetailMock = (
  overrides: Partial<ProductDetailWithRelations> = {},
): ProductDetailWithRelations => {
  const defaultProduct: ProductDetailWithRelations = {
    id: 'product-id-1',
    storeId: 'store-id-1',
    categoryId: 'category-cuid-1',
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
    // [수정] deletedAt 제거 (타입 에러 해결)

    // [수정] userId 제거 (ProductDetailWithRelations의 store 타입은 { id, name } 형태)
    store: { id: 'store-id-1', name: '테스트 스토어' },
    category: { id: 'category-cuid-1', name: 'TOP' },
    stocks: [
      {
        id: 'stock-id-1',
        productId: 'product-id-1',
        sizeId: 1,
        quantity: 10,
        reservedQuantity: 0, // stock 도메인에 reservedQuantity 추가됨
        size: { id: 1, en: 'L', ko: '라지' },
      },
    ],
    inquiries: [],
    reviews: [],
  };

  return { ...defaultProduct, ...overrides };
};

/**
 * Product Repository 생성 결과 (Simple) Mock
 * - Detail 타입에서 관계형 필드(inquiries, reviews)를 제외하여 반환합니다.
 */
export const createProductSimpleMock = (
  overrides: Partial<ProductWithRelations> = {},
): ProductWithRelations => {
  const detail = createProductDetailMock(overrides as Partial<ProductDetailWithRelations>);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { inquiries, reviews, ...simpleProduct } = detail;

  return simpleProduct as ProductWithRelations;
};

/**
 * 상품 생성 요청 DTO Mock
 */
export const createProductInputMock = (
  overrides: Partial<CreateProductDto> = {},
): CreateProductDto => {
  const defaultData: CreateProductDto = {
    name: '새 상품',
    price: 20000,
    content: '새 상품 상세',
    image: 'https://test.com/new.jpg',
    discountRate: 0,
    discountStartTime: null,
    discountEndTime: null,
    categoryName: 'TOP',
    stocks: [{ sizeId: 1, quantity: 100 }],
  };

  return { ...defaultData, ...overrides };
};

/**
 * 상품 수정 요청 DTO Mock
 * - UpdateProductDto 타입 정의에 id가 필수이므로 포함합니다.
 */
export const updateProductInputMock = (
  overrides: Partial<UpdateProductDto> = {},
): UpdateProductDto => {
  const defaultData: UpdateProductDto = {
    id: 'product-id-1',
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

  return { ...defaultData, ...overrides };
};
