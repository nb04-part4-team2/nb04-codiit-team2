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
}
