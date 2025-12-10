import { PrismaClient, Prisma } from '@prisma/client';

// Prisma 유틸리티를 사용해 DB에서 반환될 데이터의 타입을 정확히 정의
export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    stocks: { include: { size: true } };
    store: { select: { id: true; name: true } };
    category: true;
  };
}>;

// DB 저장용 데이터 타입 (DTO와 달리 날짜가 Date 타입)
export interface CreateProductData {
  name: string;
  price: number;
  content: string;
  image: string;
  discountRate: number;
  discountStartTime: Date | null;
  discountEndTime: Date | null;
  categoryId: string; // ID로 저장
  stocks: {
    sizeId: number;
    quantity: number;
  }[];
}

// 레포지토리 조회용 파라미터 인터페이스 정의
// DTO에 의존하지 않고, 순수하게 DB 조회에 필요한 데이터 구조를 정의합니다.
// 이를 통해 Controller/DTO 계층의 변경이 DB 계층에 영향을 주지 않도록 분리합니다.
export interface FindProductsParams {
  page: number;
  pageSize: number;
  search?: string;
  sort?: 'mostReviewed' | 'recent' | 'lowPrice' | 'highPrice' | 'highRating' | 'salesRanking';
  priceMin?: number;
  priceMax?: number;
  categoryName?: string;
  size?: string;
  favoriteStore?: string;
}

export class ProductRepository {
  constructor(private prisma: PrismaClient) {}

  // 유저 ID로 스토어 조회 (스키마 변경 반영: sellerId -> userId)
  async findStoreByUserId(userId: string) {
    return this.prisma.store.findUnique({
      where: { userId },
      select: { id: true },
    });
  }

  // 카테고리 이름으로 조회
  async findCategoryByName(name: string) {
    return this.prisma.category.findFirst({
      where: { name },
      select: { id: true },
    });
  }

  // 상품 생성
  async create(storeId: string, data: CreateProductData): Promise<ProductWithRelations> {
    const { stocks, categoryId, ...productData } = data;

    return this.prisma.product.create({
      data: {
        ...productData,
        store: { connect: { id: storeId } },
        category: { connect: { id: categoryId } },
        stocks: {
          create: stocks.map((stock) => ({
            size: { connect: { id: stock.sizeId } },
            quantity: stock.quantity,
          })),
        },
      },
      // 위에서 정의한 ProductWithRelations 타입의 include와 똑같아야 함
      include: {
        stocks: { include: { size: true } },
        store: { select: { id: true, name: true } },
        category: true,
      },
    });
  }

  // 상품 목록 조회
  async findAll(params: FindProductsParams) {
    const { page, pageSize, search, sort, priceMin, priceMax, categoryName, size, favoriteStore } =
      params;

    // Where 조건 절 구성 (동적 쿼리)
    const where: Prisma.ProductWhereInput = {
      // 검색 (상품명 OR 스토어명)
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } }, // 대소문자 무시
          { store: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
      // 가격 범위
      price: {
        ...(priceMin !== undefined && { gte: priceMin }),
        ...(priceMax !== undefined && { lte: priceMax }),
      },
      // 카테고리 필터
      ...(categoryName && {
        category: { name: categoryName },
      }),
      // 사이즈 필터 (재고 테이블과 조인하여 확인)
      ...(size && {
        stocks: {
          some: {
            size: {
              // ko(한글) 또는 en(영문) 중 매칭되는 것이 있는지 확인
              OR: [{ en: size }, { ko: size }],
            },
          },
        },
      }),
      // 관심 스토어 (특정 스토어 ID 필터링)
      ...(favoriteStore && {
        storeId: favoriteStore,
      }),
    };

    // 2. OrderBy 정렬 조건 구성
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }; // 기본값

    switch (sort) {
      case 'lowPrice':
        orderBy = { price: 'asc' };
        break;
      case 'highPrice':
        orderBy = { price: 'desc' };
        break;
      case 'mostReviewed':
        orderBy = { reviewsCount: 'desc' };
        break;
      case 'highRating':
        orderBy = { reviewsRating: 'desc' };
        break;
      case 'salesRanking':
        orderBy = { salesCount: 'desc' }; // Prisma 스키마에 salesCount 필드가 있어야 함
        break;
      case 'recent':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // 페이지네이션 계산
    const skip = (page - 1) * pageSize;

    // 트랜잭션으로 데이터 조회 및 전체 카운트 동시에 수행
    // (리스트 조회의 경우 DB 부하를 줄이기 위해 include를 최소화했습니다. 필요 시 추가하시면 됩니다.)
    const [products, totalCount] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          store: {
            select: { id: true, name: true }, // 목록에 필요한 스토어 이름만 조회
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, totalCount };
  }
}
