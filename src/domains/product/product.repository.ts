import { PrismaClient } from '@prisma/client';

// DB 저장용 타입
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

export class ProductRepository {
  constructor(private prisma: PrismaClient) {}

  // 판매자 ID로 스토어 조회
  async findStoreBySellerId(sellerId: string) {
    return this.prisma.store.findUnique({
      where: { sellerId },
      select: { id: true },
    });
  }

  // 카테고리 이름으로 조회
  async findCategoryByName(name: string) {
    return this.prisma.category.findFirst({
      where: { name }, // name 필드가 unique가 아닐 수 있으므로 findFirst 사용
      select: { id: true },
    });
  }

  // 상품 생성
  async create(storeId: string, data: CreateProductData) {
    const { stocks, categoryId, ...productData } = data;

    return this.prisma.product.create({
      data: {
        ...productData,
        store: { connect: { id: storeId } },
        category: { connect: { id: categoryId } }, // ID로 연결
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
}
