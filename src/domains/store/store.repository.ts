import type { Prisma, PrismaClient } from '@prisma/client';

export class StoreRepository {
  constructor(private prisma: PrismaClient) {}

  // 스토어 생성
  async create(data: Prisma.StoreCreateInput) {
    return this.prisma.store.create({ data });
  }

  // userId로 스토어 조회 (중복 검증용)
  async findByUserId(userId: string) {
    return this.prisma.store.findUnique({ where: { userId } });
  }

  // ID로 스토어 조회
  async findById(id: string) {
    return this.prisma.store.findUnique({ where: { id } });
  }

  // 스토어 좋아요 수 조회
  async countFavorites(storeId: string): Promise<number> {
    return this.prisma.storeLike.count({ where: { storeId } });
  }

  // 이번 달 좋아요 수 조회
  async countMonthFavorites(storeId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return this.prisma.storeLike.count({
      where: {
        storeId,
        createdAt: { gte: startOfMonth },
      },
    });
  }

  // 스토어 상품 개수 조회
  async countProducts(storeId: string): Promise<number> {
    return this.prisma.product.count({ where: { storeId } });
  }

  // 스토어 총 판매량 조회 (salesCount 합계)
  async getTotalSoldCount(storeId: string): Promise<number> {
    const result = await this.prisma.product.aggregate({
      where: { storeId },
      _sum: { salesCount: true },
    });
    return result._sum.salesCount ?? 0;
  }

  // 스토어 상품 목록 조회 (재고 합계 포함)
  async findProductsWithStock(storeId: string, skip: number, take: number) {
    return this.prisma.product.findMany({
      where: { storeId },
      select: {
        id: true,
        image: true,
        name: true,
        price: true,
        isSoldOut: true,
        discountRate: true,
        discountStartTime: true,
        discountEndTime: true,
        createdAt: true,
        stocks: {
          select: { quantity: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }
}
