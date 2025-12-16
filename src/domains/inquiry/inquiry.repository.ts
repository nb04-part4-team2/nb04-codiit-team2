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
  public createInquiry = async (
    createData: Prisma.InquiryCreateInput,
    tx?: Prisma.TransactionClient,
  ) => {
    const prismaClient = tx ?? this.prisma;
    const inquiry = await prismaClient.inquiry.create({
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
  public getInquiryById = async (id: string) => {
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

  // 답변 생성
  public createReply = async (
    createData: Prisma.ReplyCreateInput,
    tx?: Prisma.TransactionClient,
  ) => {
    const prismaClient = tx ?? this.prisma;
    const reply = await prismaClient.reply.create({
      data: createData,
      select: {
        id: true,
        inquiryId: true,
        userId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return reply;
  };

  // 답변 수정
  public updateReply = async (id: string, updateData: Prisma.ReplyUpdateInput) => {
    const reply = await this.prisma.reply.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        inquiryId: true,
        userId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return reply;
  };

  // 상품 찾기
  public findProductByProductId = async (productId: string) => {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: {
          select: {
            userId: true,
          },
        },
      },
    });

    return product;
  };

  // 문의 찾기
  public findInquiryById = async (id: string) => {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            name: true,
            store: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    return inquiry;
  };

  // 답변 찾기
  public findReplyById = async (id: string) => {
    const reply = await this.prisma.reply.findUnique({
      where: { id },
    });

    return reply;
  };

  // 문의 상태 변경
  public updateStatusInquiry = async (
    updateData: Prisma.InquiryUpdateInput,
    id: string,
    tx?: Prisma.TransactionClient,
  ) => {
    const prismaClient = tx ?? this.prisma;
    return await prismaClient.inquiry.update({
      where: { id },
      data: updateData,
    });
  };

  // 문의 카운트
  public countInquiries = async (countQuery: Prisma.InquiryCountArgs) => {
    const count = await this.prisma.inquiry.count(countQuery);

    return count;
  };
}
