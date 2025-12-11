import {
  DetailProductResponse,
  ProductListDto,
  ProductListResponse,
  ReviewStatsDto,
} from './product.dto.js';
import { ProductDetailWithRelations, ProductListWithRelations } from './product.repository.js';

export class ProductMapper {
  // 입력 타입을 ProductListWithRelations[] 로 변경
  static toProductListResponse(
    products: ProductListWithRelations[],
    totalCount: number,
  ): ProductListResponse {
    return {
      list: products.map((product) => this.toProductListDto(product)),
      totalCount,
    };
  }

  // 입력 타입을 ProductListWithRelations 로 변경
  private static toProductListDto(product: ProductListWithRelations): ProductListDto {
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

    return {
      id: product.id,
      storeId: product.storeId,
      storeName: product.store.name,
      name: product.name,
      image: product.image,
      price: product.price,
      discountPrice,
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

  // 입력 타입을 ProductDetailWithRelations로 명시
  static toDetailResponse(product: ProductDetailWithRelations): DetailProductResponse {
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
      // product가 정확히 타이핑되면 review의 타입도 자동으로 추론됩니다.
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
      discountPrice,
      discountRate: product.discountRate,
      discountStartTime: product.discountStartTime?.toISOString() ?? null,
      discountEndTime: product.discountEndTime?.toISOString() ?? null,
      reviewsCount: product.reviewsCount ?? 0,
      reviews: [stats],
      // inquiries 매핑
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
          : null,
      })),
      category: [{ name: product.category.name, id: product.category.id }],
      // stocks 매핑
      stocks: product.stocks.map((stock) => ({
        id: stock.id,
        productId: stock.productId,
        quantity: stock.quantity,
        size: { id: stock.sizeId, name: stock.size.en },
      })),
    };
  }
}
