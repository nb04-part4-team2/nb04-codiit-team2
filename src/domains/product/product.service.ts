import { ProductRepository } from './product.repository.js';
import { CreateProductDto, DetailProductResponse, ReviewStatsDto } from './product.dto.js';
import { NotFoundError } from '@/common/utils/errors.js';
import { Product, Category, Stock, Size, Review, Inquiry, Reply, User } from '@prisma/client';

// Inquiry가 포함하고 있는 중첩 관계(Reply -> User)를 위한 타입 정의
type InquiryWithRelations = Inquiry & {
  reply: (Reply & { user: User }) | null;
};

// DB 조회 결과 타입
type ProductWithRelations = Product & {
  store: { id: string; name: string };
  category: Category;
  stocks: (Stock & { size: Size })[];
  _count?: { reviews: number };
  reviews?: Review[]; // any[] -> Review[]
  inquiries?: InquiryWithRelations[]; // any[] -> InquiryWithRelations[]
};

export class ProductService {
  constructor(private productRepository: ProductRepository) {}

  // 응답 데이터 변환 (Mapper)
  private toProductResponse(product: ProductWithRelations): DetailProductResponse {
    const defaultReviewStats: ReviewStatsDto = {
      rate1Length: 0,
      rate2Length: 0,
      rate3Length: 0,
      rate4Length: 0,
      rate5Length: 0,
      sumScore: 0,
    };

    // DB에 데이터가 없으면 기본값 사용
    const reviewStats = product.reviews ? [defaultReviewStats] : [defaultReviewStats];

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
      discountPrice: Math.floor(product.price * (1 - product.discountRate / 100)),
      discountRate: product.discountRate,
      discountStartTime: product.discountStartTime?.toISOString() ?? null,
      discountEndTime: product.discountEndTime?.toISOString() ?? null,

      reviewsCount: product._count?.reviews ?? 0,
      reviews: reviewStats,

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
              user: {
                id: inquiry.reply.user.id,
                name: inquiry.reply.user.name,
              },
            }
          : undefined, // DTO 정의에 따라 null 또는 undefined
      })),

      category: [
        {
          name: product.category.name,
          id: product.category.id,
        },
      ],

      stocks: product.stocks.map((stock) => ({
        id: stock.id,
        productId: stock.productId,
        quantity: stock.quantity,
        size: {
          id: stock.sizeId,
          name: stock.size.en, // 혹은 ko, DB 데이터에 따라 선택
        },
      })),
    };
  }

  // 상품 생성 로직
  async createProduct(userId: string, data: CreateProductDto): Promise<DetailProductResponse> {
    // 스토어 검증
    const store = await this.productRepository.findStoreBySellerId(userId);
    if (!store) {
      throw new NotFoundError('스토어를 찾을 수 없습니다.');
    }

    // 카테고리 이름으로 ID 조회
    const category = await this.productRepository.findCategoryByName(data.categoryName);
    if (!category) {
      throw new NotFoundError('카테고리가 없습니다.');
    }

    // 데이터 변환
    const productDataForDb = {
      name: data.name,
      price: data.price,
      content: data.content,
      image: data.image,
      discountRate: data.discountRate,
      discountStartTime: data.discountStartTime ? new Date(data.discountStartTime) : null,
      discountEndTime: data.discountEndTime ? new Date(data.discountEndTime) : null,
      categoryId: category.id,
      stocks: data.stocks,
    };

    // DB 저장
    const product = await this.productRepository.create(store.id, productDataForDb);

    // 응답 변환 (타입 단언 사용), product -> toProductResponse 변환하기 위해
    return this.toProductResponse(product as unknown as ProductWithRelations);
  }
}
