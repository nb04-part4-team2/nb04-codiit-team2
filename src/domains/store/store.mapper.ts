import type { Store } from '@prisma/client';
import type {
  StoreResponse,
  StoreDetailResponse,
  MyStoreDetailResponse,
  MyStoreProductItem,
  MyStoreProductListResponse,
  FavoriteStoreResponse,
} from './store.type.js';

// ============================================
// 내부 입력 타입 (Service에서 조합해서 전달)
// ============================================

/** 내 스토어 상품 조회 시 필요한 데이터 */
export interface ProductWithStock {
  id: string;
  image: string;
  name: string;
  price: number;
  stock: number;
  isDiscount: boolean;
  createdAt: Date;
}

// ============================================
// 기본 스토어 변환
// ============================================

/**
 * Prisma Store 엔티티를 API 응답으로 변환
 * Date → ISO 8601 string으로 변환 (JSON 직렬화 일관성)
 */
export const toStoreResponse = (store: Store): StoreResponse => ({
  id: store.id,
  userId: store.userId,
  name: store.name,
  address: store.address,
  detailAddress: store.detailAddress,
  phoneNumber: store.phoneNumber,
  content: store.content,
  image: store.image,
  createdAt: store.createdAt.toISOString(),
  updatedAt: store.updatedAt.toISOString(),
});

// ============================================
// 스토어 상세 조회 변환 (공개)
// ============================================

/**
 * 스토어 상세 조회 응답 변환 (favoriteCount 포함)
 */
export const toStoreDetailResponse = (
  store: Store,
  favoriteCount: number,
): StoreDetailResponse => ({
  ...toStoreResponse(store),
  favoriteCount,
});

// ============================================
// 내 스토어 상세 조회 변환
// ============================================

/**
 * 내 스토어 상세 조회 응답 변환
 */
export const toMyStoreDetailResponse = (
  store: Store,
  stats: {
    productCount: number;
    favoriteCount: number;
    monthFavoriteCount: number;
    totalSoldCount: number;
  },
): MyStoreDetailResponse => ({
  ...toStoreResponse(store),
  productCount: stats.productCount,
  favoriteCount: stats.favoriteCount,
  monthFavoriteCount: stats.monthFavoriteCount,
  totalSoldCount: stats.totalSoldCount,
});

// ============================================
// 내 스토어 상품 변환
// ============================================

/**
 * 상품 데이터를 내 스토어 상품 아이템으로 변환
 * Service에서 ProductWithStock 형태로 데이터를 조합해서 전달
 */
export const toMyStoreProductItem = (product: ProductWithStock): MyStoreProductItem => ({
  id: product.id,
  image: product.image,
  name: product.name,
  price: product.price,
  stock: product.stock,
  isDiscount: product.isDiscount,
  createdAt: product.createdAt.toISOString(),
  isSoldOut: product.stock === 0,
});

/**
 * 내 스토어 상품 목록 응답 변환
 */
export const toMyStoreProductListResponse = (
  products: ProductWithStock[],
  totalCount: number,
): MyStoreProductListResponse => ({
  list: products.map(toMyStoreProductItem),
  totalCount,
});

// ============================================
// 관심 스토어 변환
// ============================================

/**
 * 관심 스토어 응답 변환
 */
export const toFavoriteStoreResponse = (
  type: 'register' | 'delete',
  store: Store,
): FavoriteStoreResponse => ({
  type,
  store: toStoreResponse(store),
});
