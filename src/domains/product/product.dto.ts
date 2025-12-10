import { z } from 'zod';
import { createProductSchema, productListSchema } from './product.schema.js';

// Zod 스키마로부터 타입 추론
export type CreateProductDto = z.infer<typeof createProductSchema>;
export type ProductListQueryDto = z.infer<typeof productListSchema>;

// --- 응답 DTO ---

export interface ReviewStatsDto {
  rate1Length: number;
  rate2Length: number;
  rate3Length: number;
  rate4Length: number;
  rate5Length: number;
  sumScore: number;
}

export interface ReplyDto {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string };
}

export interface DetailInquiryDto {
  id: string;
  title: string;
  content: string;
  status: string;
  isSecret: boolean;
  createdAt: string;
  updatedAt: string;
  reply?: ReplyDto | null;
}

export interface CategoryResponseDto {
  name: string;
  id: string;
}

export interface StocksDto {
  id: string;
  productId: string;
  quantity: number;
  size: {
    id: number;
    name: string;
  };
}

export interface ProductListDto {
  id: string;
  storeId: string;
  storeName: string; // JOIN을 통해 가져올 스토어 이름
  name: string;
  image: string;
  price: number;
  discountPrice: number; // 할인이 적용된 최종 가격 (계산 필요)
  discountRate: number;
  discountStartTime: string | null;
  discountEndTime: string | null;
  reviewsCount: number;
  reviewsRating: number;
  createdAt: string;
  updatedAt: string;
  sales: number; // 판매량
  isSoldOut: boolean;
}

// 최종적으로 클라이언트에게 내려줄 목록 응답 형태 (페이지네이션 정보 포함)
export interface ProductListResponse {
  list: ProductListDto[]; // 위에서 정의한 상품 객체 배열
  totalCount: number; // 검색 조건에 맞는 전체 상품 수 (페이지네이션 계산용)
}

// 최종 상세 응답 DTO
export interface DetailProductResponse {
  id: string;
  name: string;
  image: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  reviewsRating: number;
  storeId: string;
  storeName: string;
  price: number;
  discountPrice: number;
  discountRate: number;
  discountStartTime: string | null;
  discountEndTime: string | null;
  reviewsCount: number;
  reviews: ReviewStatsDto[];
  inquiries: DetailInquiryDto[];
  category: CategoryResponseDto[];
  stocks: StocksDto[];
}
