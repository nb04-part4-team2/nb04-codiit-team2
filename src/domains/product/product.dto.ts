import { z } from 'zod';
import { createProductSchema } from './product.schema.js';

// Zod 스키마로부터 타입 추론
export type CreateProductDto = z.infer<typeof createProductSchema>;

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
