import type { PrismaClient, Prisma, UserType } from '@prisma/client';
import type {
  OffsetQuery,
  CreateInquiryBody,
  UpdateInquiryBody,
  CreateReplyBody,
  UpdateReplyBody,
} from './inquiry.dto.js';
import type { InquiryRepository } from './inquiry.repository.js';
import type { NotificationService } from '@/domains/notification/notification.service.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/common/utils/errors.js';
import { sseManager } from '@/common/utils/sse.manager.js';

export class InquiryService {
  constructor(
    private inquiryRepository: InquiryRepository,
    private notificationService: NotificationService,
    private prisma: PrismaClient,
  ) {}

  // 특정 상품의 모든 문의 조회
  public getInquiries = async (productId: string) => {
    // 상품 존재 확인
    const findProduct = await this.inquiryRepository.findProductByProductId(productId);
    if (!findProduct) throw new NotFoundError('상품이 존재하지 않습니다.');

    const countQuery: Prisma.InquiryCountArgs = {
      where: { productId },
    };

    const getQuery: Prisma.InquiryFindManyArgs = {
      where: { productId },
      orderBy: {
        createdAt: 'desc',
      },
    };

    const [totalCount, inquiries] = await Promise.all([
      this.inquiryRepository.countInquiries(countQuery),
      this.inquiryRepository.getInquiries(getQuery),
    ]);

    return {
      list: inquiries,
      totalCount,
    };
  };

  // 문의 생성
  public createInquiry = async (productId: string, userId: string, data: CreateInquiryBody) => {
    // 상품 존재 확인
    const findProduct = await this.inquiryRepository.findProductByProductId(productId);
    if (!findProduct) throw new NotFoundError('상품이 존재하지 않습니다.');

    const { title, content, isSecret } = data;

    const createData: Prisma.InquiryCreateInput = {
      title,
      content,
      isSecret,
      user: {
        connect: {
          id: userId,
        },
      },
      product: {
        connect: {
          id: productId,
        },
      },
    };

    // 트랜잭션 사용
    const result = await this.prisma.$transaction(async (tx) => {
      // 문의 생성
      const inquiry = await this.inquiryRepository.createInquiry(createData, tx);

      // 본인 상품에 타인의 문의가 생성될 경우 알림 생성
      if (findProduct.store.userId !== userId) {
        const notificationData = {
          userId: findProduct.store.userId,
          content: `${findProduct.name}에 새로운 문의가 등록되었습니다.`,
        };

        // 알림 생성
        const notification = await this.notificationService.createNotification(
          notificationData,
          tx,
        );
        return { inquiry, notification };
      }

      return { inquiry, notification: null };
    });

    // sse 전송
    if (result.notification) {
      sseManager.sendMessage(result.notification.userId, result.notification);
    }

    return result.inquiry;
  };

  // 모든 문의 조회 (사용자 본인의 문의)
  public getAllInquiries = async (query: OffsetQuery, userId: string, userType: UserType) => {
    const { page = 1, pageSize = 100, status } = query;
    const take = pageSize;
    const skip = (page - 1) * take;

    // 판매자, 구매자에 따라 where 분기 처리
    const where: Prisma.InquiryWhereInput = {
      ...(status && { status }),
      ...(userType === 'SELLER' ? { product: { store: { userId } } } : { userId }),
    };

    const countQuery: Prisma.InquiryCountArgs = { where };
    const getQuery: Prisma.InquiryFindManyArgs = {
      where,
      take,
      skip,
      orderBy: {
        createdAt: 'desc',
      },
    };

    const [totalCount, inquiries] = await Promise.all([
      this.inquiryRepository.countInquiries(countQuery),
      this.inquiryRepository.getAllInquiries(getQuery),
    ]);

    return {
      list: inquiries,
      totalCount,
    };
  };

  // 특정 문의 조회
  public getInquiryById = async (id: string) => {
    const inquiry = await this.inquiryRepository.getInquiryById(id);
    if (!inquiry) throw new NotFoundError('문의가 존재하지 않습니다.');

    return inquiry;
  };

  // 문의 수정
  public updateInquiry = async (id: string, userId: string, data: UpdateInquiryBody) => {
    // 문의 존재 및 인가 확인
    const findInquiry = await this.inquiryRepository.findInquiryById(id);
    if (!findInquiry) throw new NotFoundError('문의가 존재하지 않습니다.');
    if (findInquiry.userId !== userId) throw new ForbiddenError('문의를 수정할 권한이 없습니다.');
    if (findInquiry.status == 'CompletedAnswer')
      throw new ForbiddenError('답변 완료된 문의는 수정할 수 없습니다.');

    const { title, content, isSecret } = data;

    const updateData: Prisma.InquiryUpdateInput = {
      ...(title !== findInquiry.title && { title }),
      ...(content !== findInquiry.content && { content }),
      ...(isSecret !== findInquiry.isSecret && { isSecret }),
    };

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestError('수정할 내용이 없습니다.');
    }

    const inquiry = await this.inquiryRepository.updateInquiry(id, updateData);

    return inquiry;
  };

  // 문의 삭제
  public deleteInquiry = async (id: string, userId: string) => {
    // 문의 존재 및 인가 확인
    const findInquiry = await this.inquiryRepository.findInquiryById(id);
    if (!findInquiry) throw new NotFoundError('문의가 존재하지 않습니다.');
    if (findInquiry.userId !== userId) throw new ForbiddenError('문의를 삭제할 권한이 없습니다.');

    const inquiry = await this.inquiryRepository.deleteInquiry(id);

    return inquiry;
  };

  // 답변 생성
  public createReply = async (id: string, userId: string, data: CreateReplyBody) => {
    // 문의 존재 및 인가 확인
    const findInquiry = await this.inquiryRepository.findInquiryById(id);
    if (!findInquiry) throw new NotFoundError('문의가 존재하지 않습니다.');
    if (findInquiry.product.store.userId !== userId)
      throw new ForbiddenError('답변을 생성할 권한이 없습니다.');

    const { content } = data;

    const createData: Prisma.ReplyCreateInput = {
      content,
      user: {
        connect: {
          id: userId,
        },
      },
      inquiry: {
        connect: {
          id,
        },
      },
    };

    const updateData: Prisma.InquiryUpdateInput = {
      status: 'CompletedAnswer',
    };

    // 트랜잭션 사용
    const result = await this.prisma.$transaction(async (tx) => {
      // 답변 생성
      const reply = await this.inquiryRepository.createReply(createData, tx);
      // 문의 상태 변경
      await this.inquiryRepository.updateStatusInquiry(updateData, id, tx);

      // 본인 문의에 타인의 답변이 생성될 경우 알림 생성
      if (findInquiry.userId !== userId) {
        const notificationData = {
          userId: findInquiry.userId,
          content: `${findInquiry.product.name}에 대한 문의에 답변이 달렸습니다.`,
        };

        // 알림 생성
        const notification = await this.notificationService.createNotification(
          notificationData,
          tx,
        );
        return { reply, notification };
      }

      return { reply, notification: null };
    });

    // sse 전송
    if (result.notification) {
      sseManager.sendMessage(result.notification.userId, result.notification);
    }

    return result.reply;
  };

  // 답변 수정
  public updateReply = async (id: string, userId: string, data: UpdateReplyBody) => {
    // 답변 존재 및 인가 확인
    const findReply = await this.inquiryRepository.findReplyById(id);
    if (!findReply) throw new NotFoundError('답변이 존재하지 않습니다.');
    if (findReply.userId !== userId) throw new ForbiddenError('답변을 수정할 권한이 없습니다.');

    const { content } = data;

    const updateData: Prisma.ReplyUpdateInput = {
      ...(content !== findReply.content && { content }),
    };

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestError('수정할 내용이 없습니다.');
    }

    const reply = await this.inquiryRepository.updateReply(id, updateData);

    return reply;
  };
}
