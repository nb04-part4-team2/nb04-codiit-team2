import { ProductRepository } from './product.repository.js';
import { CreateProductDto, DetailProductResponse, ReviewStatsDto } from './product.dto.js';
import { NotFoundError } from '@/common/utils/errors.js';
// Prisma 모델 타입 임포트
import { Product, Category, Stock, Size, Review, Inquiry, Reply, User } from '@prisma/client';

// 범용 타입 정의
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

export class ProductService {
  constructor(private productRepository: ProductRepository) {}

  //공통 응답 변환 메서드 (Mapper)

  private toProductResponse(product: ProductWithRelations): DetailProductResponse {
    // 리뷰 통계 기본값 (0점)
    const defaultReviewStats: ReviewStatsDto = {
      rate1Length: 0,
      rate2Length: 0,
      rate3Length: 0,
      rate4Length: 0,
      rate5Length: 0,
      sumScore: 0,
    };

    // 리뷰 데이터 처리
    // - product.reviews가 있으면(조회 시): 추후 실제 통계 계산 로직 적용
    // - product.reviews가 없으면(등록 시): defaultReviewStats 배열 사용
    const reviewStats = product.reviews
      ? [defaultReviewStats] // TODO: 나중에 여기에 실제 통계 계산 함수 연결
      : [defaultReviewStats];

    return {
      id: product.id,
      name: product.name,
      image: product.image,
      content: product.content || '',

      // Date 객체 -> ISO String 변환
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

      // 위에서 처리한 통계 객체 배열
      reviews: reviewStats,

      // 문의 목록 매핑 (없으면 빈 배열 [])
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
          : undefined, // DTO가 optional이라면 undefined, nullable이면 null
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
          name: stock.size.en, // DB 데이터에 따라 en 또는 ko 선택
        },
      })),
    };
  }

  // 상품 생성 로직
  async createProduct(userId: string, data: CreateProductDto): Promise<DetailProductResponse> {
    // 1. 스토어 검증
    const store = await this.productRepository.findStoreByUserId(userId);
    if (!store) {
      throw new NotFoundError('스토어를 찾을 수 없습니다.');
    }

    // 카테고리 검증 및 ID 조회
    const category = await this.productRepository.findCategoryByName(data.categoryName);
    if (!category) {
      throw new NotFoundError('카테고리가 없습니다.');
    }

    // 데이터 변환 (DTO -> Repository Type)
    const productDataForDb = {
      name: data.name,
      price: data.price,
      content: data.content,
      image: data.image,
      discountRate: data.discountRate,
      // String -> Date 변환
      discountStartTime: data.discountStartTime ? new Date(data.discountStartTime) : null,
      discountEndTime: data.discountEndTime ? new Date(data.discountEndTime) : null,
      // Name -> ID 변환
      categoryId: category.id,
      stocks: data.stocks,
    };

    // DB 저장
    // Repository의 반환 타입은 ProductWithRelations의 부분집합(Subset)이므로 호환됨
    const product = await this.productRepository.create(store.id, productDataForDb);

    // 응답 변환
    return this.toProductResponse(product);
  }
}
