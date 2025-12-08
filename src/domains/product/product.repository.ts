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
  // 반환 타입을 Promise<ProductWithRelations>로 명시
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
}
