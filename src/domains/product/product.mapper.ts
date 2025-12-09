import { Product, Category, Stock, Size, Review, Inquiry, Reply, User } from '@prisma/client';
import { DetailProductResponse, ReviewStatsDto } from './product.dto.js';

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
            // 1~5점 범위를 벗어난 경우 처리 (필요시 로깅 등)
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

      // DB에 저장된 평점 사용 (필요시 위에서 계산한 stats.sumScore / reviews.length로 대체 가능)
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
