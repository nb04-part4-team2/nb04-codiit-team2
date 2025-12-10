import { Product, Category, Stock, Size, Review, Inquiry, Reply, User } from '@prisma/client';
import {
  DetailProductResponse,
  ProductListDto,
  ProductListResponse,
  ReviewStatsDto,
} from './product.dto.js';

type InquiryWithRelations = Inquiry & {
  reply: (Reply & { user: User }) | null;
};

type ProductWithRelations = Product & {
  store: { id: string; name: string };
  category: Category;
  stocks: (Stock & { size: Size })[];
  _count?: { reviews: number };
  reviews?: Review[];
  inquiries?: InquiryWithRelations[];
};

export class ProductMapper {
  /**
   * 상품 목록 조회 응답 변환
   * @param products DB에서 조회된 상품 배열 (store 정보 포함)
   * @param totalCount 전체 상품 수
   */
  static toProductListResponse(
    products: (Product & { store: { id: string; name: string } })[],
    totalCount: number,
  ): ProductListResponse {
    return {
      list: products.map((product) => this.toProductListDto(product)),
      totalCount,
    };
  }

  /**
   * 단일 상품을 리스트 아이템 DTO로 변환 (내부 헬퍼 함수)
   */
  private static toProductListDto(
    product: Product & { store: { id: string; name: string } },
  ): ProductListDto {
    // 할인가 계산 (할인율이 없으면 정가 그대로, 소수점 버림)
    const discountPrice =
      product.discountRate > 0
        ? Math.floor(product.price * (1 - product.discountRate / 100))
        : product.price;

    return {
      id: product.id,
      storeId: product.storeId,
      storeName: product.store.name, // Join된 스토어 이름
      name: product.name,
      image: product.image,
      price: product.price,
      discountPrice: discountPrice, // 계산된 할인가
      discountRate: product.discountRate,
      discountStartTime: product.discountStartTime?.toISOString() ?? null,
      discountEndTime: product.discountEndTime?.toISOString() ?? null,
      reviewsCount: product.reviewsCount,
      reviewsRating: product.reviewsRating,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      sales: product.salesCount, // DB 필드명(salesCount) -> DTO 필드명(sales) 매핑
      isSoldOut: product.isSoldOut,
    };
  }

  /**
   * 상품 상세 조회 응답 변환
   */
  static toDetailResponse(product: ProductWithRelations): DetailProductResponse {
    // 리뷰 통계 계산 로직 구현
    // 기본값 초기화
    const stats: ReviewStatsDto = {
      rate1Length: 0,
      rate2Length: 0,
      rate3Length: 0,
      rate4Length: 0,
      rate5Length: 0,
      sumScore: 0,
    };

    // 리뷰 데이터가 존재하면 순회하며 통계 집계
    if (product.reviews && product.reviews.length > 0) {
      product.reviews.forEach((review) => {
        // 총점 누적
        stats.sumScore += review.rating;

        // 별점별 개수 카운팅
        switch (review.rating) {
          case 1:
            stats.rate1Length++;
            break;
          case 2:
            stats.rate2Length++;
            break;
          case 3:
            stats.rate3Length++;
            break;
          case 4:
            stats.rate4Length++;
            break;
          case 5:
            stats.rate5Length++;
            break;
          default:
            break;
        }
      });
    }

    // 응답 객체 조립
    return {
      id: product.id,
      name: product.name,
      image: product.image,
      content: product.content || '',
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),

      // DB에 저장된 평점 사용
      reviewsRating: product.reviewsRating ?? 0,

      storeId: product.storeId,
      storeName: product.store.name,

      price: product.price,
      // 할인 가격 계산 (소수점 버림)
      discountPrice: Math.floor(product.price * (1 - product.discountRate / 100)),
      discountRate: product.discountRate,
      discountStartTime: product.discountStartTime?.toISOString() ?? null,
      discountEndTime: product.discountEndTime?.toISOString() ?? null,

      reviewsCount: product._count?.reviews ?? 0,

      // 계산된 통계 객체를 배열에 담아 반환
      reviews: [stats],

      // 문의 매핑
      inquiries: (product.inquiries ?? []).map((inquiry) => ({
        id: inquiry.id,
        title: inquiry.title,
        content: inquiry.content,
        status: inquiry.status,
        isSecret: inquiry.isSecret,
        createdAt: inquiry.createdAt.toISOString(),
        updatedAt: inquiry.updatedAt.toISOString(),
        reply: inquiry.reply
          ? {
              id: inquiry.reply.id,
              content: inquiry.reply.content,
              createdAt: inquiry.reply.createdAt.toISOString(),
              updatedAt: inquiry.reply.updatedAt.toISOString(),
              user: { id: inquiry.reply.user.id, name: inquiry.reply.user.name },
            }
          : undefined,
      })),

      // 카테고리 매핑
      category: [
        {
          name: product.category.name,
          id: product.category.id,
        },
      ],

      // 재고 매핑
      stocks: product.stocks.map((stock) => ({
        id: stock.id,
        productId: stock.productId,
        quantity: stock.quantity,
        size: {
          id: stock.sizeId,
          name: stock.size.en,
        },
      })),
    };
  }
}
