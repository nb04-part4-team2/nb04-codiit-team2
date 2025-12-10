import { PrismaClient, Prisma } from '@prisma/client';

// Prisma 유틸리티를 사용해 DB에서 반환될 데이터의 타입을 정확히 정의
export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    stocks: { include: { size: true } };
    store: { select: { id: true; name: true } };
    category: true;
  };
}>;

// DB 저장용 데이터 타입
export interface CreateProductData {
  name: string;
  price: number;
  content: string;
  image: string;
  discountRate: number;
  discountStartTime: Date | null;
  discountEndTime: Date | null;
  categoryId: string;
  stocks: {
    sizeId: number;
    quantity: number;
  }[];
}

// 레포지토리 조회용 파라미터 인터페이스
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

  // 유저 ID로 스토어 조회
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

    // Where 조건 구성
    const where: Prisma.ProductWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { store: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
      price: {
        ...(priceMin !== undefined && { gte: priceMin }),
        ...(priceMax !== undefined && { lte: priceMax }),
      },
      ...(categoryName && {
        category: { name: categoryName },
      }),
      ...(size && {
        stocks: {
          some: {
            size: {
              OR: [{ en: size }, { ko: size }], // 영문/한글 사이즈 모두 검색
            },
          },
        },
      }),
      ...(favoriteStore && {
        storeId: favoriteStore,
      }),
    };

    // OrderBy 정렬 구성
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };

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
        orderBy = { salesCount: 'desc' };
        break;
      case 'recent':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const skip = (page - 1) * pageSize;

    // 트랜잭션으로 데이터 + 카운트 조회
    const [products, totalCount] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          store: {
            select: { id: true, name: true },
          },
          // 리스트에서는 stocks, category 전체 정보가 필요 없으므로 include 최소화
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, totalCount };
  }
}
