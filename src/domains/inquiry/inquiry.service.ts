import type { Prisma } from '@prisma/client';
import type {
  OffsetQuery,
  CreateInquiryBody,
  UpdateInquiryBody,
  CreateReplyBody,
  UpdateReplyBody,
} from './inquiry.dto.js';
import type { InquiryRepository } from './inquiry.repository.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/common/utils/errors.js';

export class InquiryService {
  constructor(private inquiryRepository: InquiryRepository) {}

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

    const inquiry = await this.inquiryRepository.createInquiry(createData);

    return inquiry;
  };

  // 모든 문의 조회 (사용자 본인의 문의)
  public getAllInquiries = async (query: OffsetQuery, userId: string) => {
    const { page = '1', pageSize = '100', status } = query;

    // page와 pageSize 타입이 원래 number 여야 하는데 validate 미들웨어에서 query를 number로 넘기면 에러가 나서
    // 어쩔수 없이 page와 pageSize를 string으로 보내고, 서비스에서 string에서 number로 바꿔야 했습니다.
    // 이거 해결하는 방법 아시는 분 알려주시면 감사하겠습니다.
    const pageInt = parseInt(page, 10) || 1;
    const pageSizeInt = parseInt(pageSize, 10) || 100;

    const take = pageSizeInt;
    const skip = (pageInt - 1) * take;

    const countQuery: Prisma.InquiryCountArgs = {
      where: {
        ...(status && { status }),
        userId,
      },
    };

    const getQuery: Prisma.InquiryFindManyArgs = {
      where: {
        ...(status && { status }),
        userId,
      },
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

  // 답변 조회
  // public getReplyById = async (id: string) => {
  //   const reply = await this.inquiryRepository.getReplyById(id);
  //   if (!reply) throw new NotFoundError('답변이 존재하지 않습니다.');

  //   return reply;
  // };

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
    const reply = await this.inquiryRepository.createReply(createData, id, updateData);

    return reply;
  };

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
