import type { Prisma, PrismaClient } from '@prisma/client';

export class InquiryRepository {
  constructor(private prisma: PrismaClient) {}

  // 특정 상품의 모든 문의 조회
  public getInquiries = async (getQuery: Prisma.InquiryFindManyArgs) => {
    const inquiries = await this.prisma.inquiry.findMany({
      ...getQuery,
      select: {
        id: true,
        userId: true,
        productId: true,
        title: true,
        content: true,
        status: true,
        isSecret: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
          },
        },
        reply: {
          select: {
            id: true,
            inquiryId: true,
            userId: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return inquiries;
  };

  // 문의 생성
  public createInquiry = async (createData: Prisma.InquiryCreateInput) => {
    const inquiry = await this.prisma.inquiry.create({
      data: createData,
      select: {
        id: true,
        userId: true,
        productId: true,
        title: true,
        content: true,
        status: true,
        isSecret: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return inquiry;
  };

  // 모든 문의 조회 (사용자 본인의 문의)
  public getAllInquiries = async (getQuery: Prisma.InquiryFindManyArgs) => {
    const inquiries = await this.prisma.inquiry.findMany({
      ...getQuery,
      select: {
        id: true,
        title: true,
        isSecret: true,
        status: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        content: true,
        product: {
          select: {
            id: true,
            name: true,
            image: true,
            store: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return inquiries;
  };

  // 특정 문의 조회
  public getInquiry = async (id: string) => {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        productId: true,
        title: true,
        content: true,
        status: true,
        isSecret: true,
        createdAt: true,
        updatedAt: true,
        reply: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                name: true,
                id: true,
              },
            },
          },
        },
      },
    });

    return inquiry;
  };

  // 문의 수정
  public updateInquiry = async (id: string, updateData: Prisma.InquiryUpdateInput) => {
    const inquiry = await this.prisma.inquiry.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        userId: true,
        productId: true,
        title: true,
        content: true,
        status: true,
        isSecret: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return inquiry;
  };

  // 문의 삭제
  public deleteInquiry = async (id: string) => {
    const inquiry = await this.prisma.inquiry.delete({
      where: { id },
      select: {
        id: true,
        userId: true,
        productId: true,
        title: true,
        content: true,
        status: true,
        isSecret: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return inquiry;
  };

  // 상품 찾기
  public findProduct = async (productId: string) => {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    return product;
  };

  // 문의 찾기
  public findInquiry = async (id: string) => {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
    });

    return inquiry;
  };

  // 문의 카운트
  public countInquiries = async (countQuery: Prisma.InquiryCountArgs) => {
    const count = await this.prisma.inquiry.count(countQuery);

    return count;
  };
}
