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
    // 리뷰 통계 기본값
    const defaultReviewStats: ReviewStatsDto = {
      rate1Length: 0,
      rate2Length: 0,
      rate3Length: 0,
      rate4Length: 0,
      rate5Length: 0,
      sumScore: 0,
    };

    // 리뷰 데이터 처리
    const reviewStats = product.reviews ? [defaultReviewStats] : [defaultReviewStats];

    // 응답 객체 조립
    return {
      id: product.id,
      name: product.name,
      image: product.image,
      content: product.content || '',
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      reviewsRating: product.reviewsRating ?? 0,

      storeId: product.storeId,
      storeName: product.store.name,

      price: product.price,
      // 할인 가격 계산 로직
      discountPrice: Math.floor(product.price * (1 - product.discountRate / 100)),
      discountRate: product.discountRate,
      discountStartTime: product.discountStartTime?.toISOString() ?? null,
      discountEndTime: product.discountEndTime?.toISOString() ?? null,

      reviewsCount: product._count?.reviews ?? 0,
      reviews: reviewStats,

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
