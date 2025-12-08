// ============================================
// 기본 스토어 응답
// ============================================

export interface StoreResponse {
  id: string;
  userId: string;
  name: string;
  address: string;
  detailAddress: string | null;
  phoneNumber: string;
  content: string;
  image: string | null;
  createdAt: string; // ISO 8601 형식 (JSON 직렬화)
  updatedAt: string; // ISO 8601 형식 (JSON 직렬화)
}

// ============================================
// 스토어 상세 조회 응답 (공개)
// ============================================

export interface StoreDetailResponse extends StoreResponse {
  favoriteCount: number;
}

// ============================================
// 내 스토어 상세 조회 응답
// ============================================

export interface MyStoreDetailResponse extends StoreResponse {
  productCount: number;
  favoriteCount: number;
  monthFavoriteCount: number;
  totalSoldCount: number;
}

// ============================================
// 내 스토어 상품 목록 응답
// ============================================

export interface MyStoreProductItem {
  id: string;
  image: string;
  name: string;
  price: number;
  stock: number;
  isDiscount: boolean;
  createdAt: string; // ISO 8601 형식
  isSoldOut: boolean;
}

export interface MyStoreProductListResponse {
  list: MyStoreProductItem[];
  totalCount: number;
}

// ============================================
// 관심 스토어 응답
// ============================================

export interface FavoriteStoreResponse {
  type: 'register' | 'delete';
  store: StoreResponse;
}
