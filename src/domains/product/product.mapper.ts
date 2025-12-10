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
  static toProductListResponse(
    products: (Product & { store: { id: string; name: string } })[],
    totalCount: number,
  ): ProductListResponse {
    return {
      list: products.map((product) => this.toProductListDto(product)),
      totalCount,
    };
  }

  private static toProductListDto(
    product: Product & { store: { id: string; name: string } },
  ): ProductListDto {
    // 할인 기간 체크 로직 추가
    const now = new Date();
    const isDiscountActive =
      product.discountRate > 0 &&
      product.discountStartTime &&
      product.discountEndTime &&
      now >= product.discountStartTime &&
      now <= product.discountEndTime;

    // 할인 기간일 때만 할인가 계산, 아니면 정가 사용
    const discountPrice = isDiscountActive
      ? Math.floor(product.price * (1 - product.discountRate / 100))
      : product.price;

    return {
      id: product.id,
      storeId: product.storeId,
      storeName: product.store.name,
      name: product.name,
      image: product.image,
      price: product.price,
      discountPrice, // 수정된 할인가 적용
      discountRate: product.discountRate,
      discountStartTime: product.discountStartTime?.toISOString() ?? null,
      discountEndTime: product.discountEndTime?.toISOString() ?? null,
      reviewsCount: product.reviewsCount,
      reviewsRating: product.reviewsRating,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      sales: product.salesCount,
      isSoldOut: product.isSoldOut,
    };
  }

  static toDetailResponse(product: ProductWithRelations): DetailProductResponse {
    // 상세 조회에도 동일한 할인 로직 적용
    const now = new Date();
    const isDiscountActive =
      product.discountRate > 0 &&
      product.discountStartTime &&
      product.discountEndTime &&
      now >= product.discountStartTime &&
      now <= product.discountEndTime;

    const discountPrice = isDiscountActive
      ? Math.floor(product.price * (1 - product.discountRate / 100))
      : product.price;

    // 리뷰 통계 계산
    const stats: ReviewStatsDto = {
      rate1Length: 0,
      rate2Length: 0,
      rate3Length: 0,
      rate4Length: 0,
      rate5Length: 0,
      sumScore: 0,
    };

    if (product.reviews && product.reviews.length > 0) {
      product.reviews.forEach((review) => {
        stats.sumScore += review.rating;
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
        }
      });
    }

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
      discountPrice, // 수정된 할인가 적용
      discountRate: product.discountRate,
      discountStartTime: product.discountStartTime?.toISOString() ?? null,
      discountEndTime: product.discountEndTime?.toISOString() ?? null,
      reviewsCount: product._count?.reviews ?? 0,
      reviews: [stats],
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
      category: [{ name: product.category.name, id: product.category.id }],
      stocks: product.stocks.map((stock) => ({
        id: stock.id,
        productId: stock.productId,
        quantity: stock.quantity,
        size: { id: stock.sizeId, name: stock.size.en },
      })),
    };
  }
}
