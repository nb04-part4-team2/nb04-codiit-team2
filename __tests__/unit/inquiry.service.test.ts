import { jest } from '@jest/globals';
import { InquiryRepository } from '../../src/domains/inquiry/inquiry.repository.js';
import { InquiryService } from '../../src/domains/inquiry/inquiry.service.js';
import { InquiryStatus } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { mockFindReply } from '../mocks/inquiry.mock.js';

describe('InquiryService 유닛 테스트', () => {
  let inquiryService: InquiryService;
  let inquiryRepository: DeepMockProxy<InquiryRepository>;

  const inquiryId = 'inquiry-id-1';
  const replyId = 'reply-id-1';
  const productId = 'product-id-1';
  const userId = 'user-id-1';
  const storeId = 'store-id-1';
  const categoryId = 'category-id-1';

  const mockFindProduct = {
    id: productId,
    name: '상품 이름',
    price: 10000,
    content: '상품 설명',
    image: '상품 이미지 URL',
    discountRate: 0,
    discountStartTime: null,
    discountEndTime: null,
    isSoldOut: false,
    salesCount: 0,
    reviewsCount: 0,
    reviewsRating: 0.0,
    createdAt: new Date(),
    updatedAt: new Date(),
    storeId: storeId,
    categoryId: categoryId,
  };
  const mockFindInquiry = {
    id: inquiryId,
    title: '문의 제목',
    content: '문의 내용',
    status: InquiryStatus.WaitingAnswer,
    isSecret: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: userId,
    productId: productId,
    product: {
      store: {
        userId: userId,
      },
    },
  };

  // 테스트 케이스가 실행되기 전에 매번 실행
  beforeEach(() => {
    // 의존성 주입
    inquiryRepository = mockDeep<InquiryRepository>();
    inquiryService = new InquiryService(inquiryRepository);
  });

  // 각 테스트가 끝난 후 모든 모의(mock)를 원래대로 복원
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  // 특정 상품의 모든 문의 조회
  describe('getInquiries', () => {
    it('특정 상품의 모든 문의 조회 성공', async () => {
      // --- 준비 (Arrange) ---
      const mockInquiries = [
        {
          id: 'inquiry-1',
          userId: 'user-1',
          productId: 'product-1',
          title: '문의 제목 1',
          content: '문의 내용 1',
          status: InquiryStatus.WaitingAnswer,
          isSecret: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            name: '테스트 사용자 1',
          },
          reply: null,
        },
        {
          id: 'inquiry-2',
          userId: 'user-2',
          productId: 'product-1',
          title: '문의 제목 2',
          content: '문의 내용 2',
          status: InquiryStatus.WaitingAnswer,
          isSecret: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            name: '테스트 사용자 1',
          },
          reply: null,
        },
      ];
      inquiryRepository.findProductByProductId.mockResolvedValue(mockFindProduct);
      inquiryRepository.countInquiries.mockResolvedValue(2);
      inquiryRepository.getInquiries.mockResolvedValue(mockInquiries);

      // --- 실행 (Act) ---
      const result = await inquiryService.getInquiries(productId);

      const countQuery = {
        where: { productId },
      };

      const getQuery = {
        where: { productId },
        orderBy: {
          createdAt: 'desc',
        },
      };

      // --- 검증 (Assert) ---
      expect(inquiryRepository.findProductByProductId).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.findProductByProductId).toHaveBeenCalledWith(productId);
      expect(inquiryRepository.countInquiries).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.countInquiries).toHaveBeenCalledWith(countQuery);
      expect(inquiryRepository.getInquiries).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.getInquiries).toHaveBeenCalledWith(getQuery);
      expect(result).toEqual({
        list: mockInquiries,
        totalCount: 2,
      });
    });

    it('상품이 존재하지 않을때 NotFoundError 발생', async () => {
      // --- 준비 (Arrange) ---
      inquiryRepository.findProductByProductId.mockResolvedValue(null);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(inquiryService.getInquiries(productId)).rejects.toThrow(
        '상품이 존재하지 않습니다.',
      );
    });
  });

  // 문의 생성
  describe('createInquiry', () => {
    it('문의 생성 성공', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        title: '문의 제목',
        content: '문의 내용',
        isSecret: false,
      };
      const mockInquiry = {
        id: inquiryId,
        userId: userId,
        productId: productId,
        ...data,
        status: InquiryStatus.WaitingAnswer,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inquiryRepository.findProductByProductId.mockResolvedValue(mockFindProduct);
      inquiryRepository.createInquiry.mockResolvedValue(mockInquiry);

      // --- 실행 (Act) ---
      const result = await inquiryService.createInquiry(productId, userId, data);

      const createData = {
        title: data.title,
        content: data.content,
        isSecret: data.isSecret,
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

      // --- 검증 (Assert) ---
      expect(inquiryRepository.findProductByProductId).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.findProductByProductId).toHaveBeenCalledWith(productId);
      expect(inquiryRepository.createInquiry).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.createInquiry).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockInquiry);
    });

    it('상품이 존재하지 않을때 NotFoundError 발생', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        title: '문의 제목',
        content: '문의 내용',
        isSecret: false,
      };
      inquiryRepository.findProductByProductId.mockResolvedValue(null);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(inquiryService.createInquiry(productId, userId, data)).rejects.toThrow(
        '상품이 존재하지 않습니다.',
      );
    });
  });

  // 모든 문의 조회 (사용자 본인의 문의)
  describe('getAllInquiries', () => {
    it('모든 문의 조회 성공', async () => {
      // --- 준비 (Arrange) ---
      const query = {
        page: '1',
        pageSize: '100',
        status: InquiryStatus.WaitingAnswer,
      };
      const mockInquiries = [
        {
          id: 'inquiry-1',
          title: '문의 제목 1',
          isSecret: false,
          status: InquiryStatus.WaitingAnswer,
          user: {
            id: userId,
            name: '테스트 사용자 1',
          },
          createdAt: new Date(),
          content: '문의 내용 1',
          product: {
            id: productId,
            name: '상품 이름',
            image: '상품 이미지 URL',
            store: {
              id: storeId,
              name: '상점 이름',
            },
          },
        },
        {
          id: 'inquiry-2',
          title: '문의 제목 2',
          isSecret: false,
          status: InquiryStatus.WaitingAnswer,
          user: {
            id: userId,
            name: '테스트 사용자 1',
          },
          createdAt: new Date(),
          content: '문의 내용 2',
          product: {
            id: productId,
            name: '상품 이름',
            image: '상품 이미지 URL',
            store: {
              id: storeId,
              name: '상점 이름',
            },
          },
        },
      ];
      inquiryRepository.getAllInquiries.mockResolvedValue(mockInquiries);
      inquiryRepository.countInquiries.mockResolvedValue(2);

      // --- 실행 (Act) ---
      const result = await inquiryService.getAllInquiries(query, userId);

      const countQuery = {
        where: { userId, status: query.status },
      };

      const getQuery = {
        where: { userId, status: query.status },
        take: 100,
        skip: 0,
        orderBy: {
          createdAt: 'desc',
        },
      };

      // --- 검증 (Assert) ---
      expect(inquiryRepository.countInquiries).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.countInquiries).toHaveBeenCalledWith(countQuery);
      expect(inquiryRepository.getAllInquiries).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.getAllInquiries).toHaveBeenCalledWith(getQuery);
      expect(result).toEqual({
        list: mockInquiries,
        totalCount: 2,
      });
    });

    it('query가 없을 경우, 기본값(page=1, pageSize=100)이 적용된다', async () => {
      // --- 준비 (Arrange) ---
      const query = {
        status: InquiryStatus.WaitingAnswer,
      };
      inquiryRepository.countInquiries.mockResolvedValue(0);
      inquiryRepository.getAllInquiries.mockResolvedValue([]);

      // --- 실행 (Act) ---
      await inquiryService.getAllInquiries(query, userId);

      const getQuery = {
        where: { userId, status: query.status },
        take: 100,
        skip: 0,
        orderBy: {
          createdAt: 'desc',
        },
      };

      // --- 검증 (Assert) ---
      expect(inquiryRepository.getAllInquiries).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.getAllInquiries).toHaveBeenCalledWith(getQuery);
    });

    it('page와 pageSize가 숫자가 아닌 문자열일 경우 기본값이 적용된다', async () => {
      // --- 준비 (Arrange) ---
      const query = {
        page: 'invalid',
        pageSize: 'invalid',
      };
      inquiryRepository.countInquiries.mockResolvedValue(0);
      inquiryRepository.getAllInquiries.mockResolvedValue([]);

      // --- 실행 (Act) ---
      await inquiryService.getAllInquiries(query, userId);

      const getQuery = {
        where: { userId },
        take: 100,
        skip: 0,
        orderBy: {
          createdAt: 'desc',
        },
      };

      // --- 검증 (Assert) ---
      expect(inquiryRepository.getAllInquiries).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.getAllInquiries).toHaveBeenCalledWith(getQuery);
    });
  });

  // 특정 문의 조회
  describe('getInquiry', () => {
    it('특정 문의 조회 성공', async () => {
      // --- 준비 (Arrange) ---
      const mockInquiry = {
        id: inquiryId,
        userId: userId,
        productId: productId,
        title: '문의 제목',
        content: '문의 내용',
        status: InquiryStatus.WaitingAnswer,
        isSecret: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        reply: null,
      };
      inquiryRepository.getInquiryById.mockResolvedValue(mockInquiry);

      // --- 실행 (Act) ---
      const result = await inquiryService.getInquiryById(inquiryId);

      // --- 검증 (Assert) ---
      expect(inquiryRepository.getInquiryById).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.getInquiryById).toHaveBeenCalledWith(inquiryId);
      expect(result).toEqual(mockInquiry);
    });

    it('문의가 존재하지 않을때 NotFoundError 발생', async () => {
      // --- 준비 (Arrange) ---
      inquiryRepository.getInquiryById.mockResolvedValue(null);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(inquiryService.getInquiryById(inquiryId)).rejects.toThrow(
        '문의가 존재하지 않습니다.',
      );
    });
  });

  // 문의 수정
  describe('updateInquiry', () => {
    it('문의 수정 성공', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        title: '문의 제목 수정',
        content: '문의 내용 수정',
        isSecret: true,
      };
      const mockInquiry = {
        id: inquiryId,
        userId: userId,
        productId: productId,
        ...data,
        status: InquiryStatus.WaitingAnswer,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inquiryRepository.findInquiryById.mockResolvedValue(mockFindInquiry);
      inquiryRepository.updateInquiry.mockResolvedValue(mockInquiry);

      // --- 실행 (Act) ---
      const result = await inquiryService.updateInquiry(inquiryId, userId, data);

      const updateData = {
        title: data.title,
        content: data.content,
        isSecret: data.isSecret,
      };

      // --- 검증 (Assert) ---
      expect(inquiryRepository.findInquiryById).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.findInquiryById).toHaveBeenCalledWith(inquiryId);
      expect(inquiryRepository.updateInquiry).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.updateInquiry).toHaveBeenCalledWith(inquiryId, updateData);
      expect(result).toEqual(mockInquiry);
    });

    it('문의가 존재하지 않을때 NotFoundError 발생', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        title: '문의 제목 수정',
      };
      inquiryRepository.findInquiryById.mockResolvedValue(null);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(inquiryService.updateInquiry(inquiryId, userId, data)).rejects.toThrow(
        '문의가 존재하지 않습니다.',
      );
    });

    it('문의를 수정할 권한이 없을때 ForbiddenError 발생', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        title: '문의 제목 수정',
      };
      const mockFindInquiry_userId = {
        ...mockFindInquiry,
        userId: '다른 사용자 ID',
      };
      inquiryRepository.findInquiryById.mockResolvedValue(mockFindInquiry_userId);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(inquiryService.updateInquiry(inquiryId, userId, data)).rejects.toThrow(
        '문의를 수정할 권한이 없습니다.',
      );
    });

    it('수정할 내용이 없을 때 BadRequestError 발생', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        title: mockFindInquiry.title,
        content: mockFindInquiry.content,
        isSecret: mockFindInquiry.isSecret,
      };
      inquiryRepository.findInquiryById.mockResolvedValue(mockFindInquiry);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(inquiryService.updateInquiry(inquiryId, userId, data)).rejects.toThrow(
        '수정할 내용이 없습니다.',
      );
    });

    it('답변 완료된 문의는 수정할 때 ForbiddenError 발생', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        title: '문의 제목 수정',
      };
      const mockFindInquiry_status = {
        ...mockFindInquiry,
        status: InquiryStatus.CompletedAnswer,
      };
      inquiryRepository.findInquiryById.mockResolvedValue(mockFindInquiry_status);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(inquiryService.updateInquiry(inquiryId, userId, data)).rejects.toThrow(
        '답변 완료된 문의는 수정할 수 없습니다.',
      );
    });
  });

  // 문의 삭제
  describe('deleteInquiry', () => {
    it('문의 삭제 성공', async () => {
      // --- 준비 (Arrange) ---
      const mockInquiry = {
        id: inquiryId,
        userId: userId,
        productId: productId,
        title: '문의 제목',
        content: '문의 내용',
        status: InquiryStatus.WaitingAnswer,
        isSecret: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inquiryRepository.findInquiryById.mockResolvedValue(mockFindInquiry);
      inquiryRepository.deleteInquiry.mockResolvedValue(mockInquiry);

      // --- 실행 (Act) ---
      const result = await inquiryService.deleteInquiry(inquiryId, userId);

      // --- 검증 (Assert) ---
      expect(inquiryRepository.findInquiryById).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.findInquiryById).toHaveBeenCalledWith(inquiryId);
      expect(inquiryRepository.deleteInquiry).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.deleteInquiry).toHaveBeenCalledWith(inquiryId);
      expect(result).toEqual(mockInquiry);
    });

    it('문의가 존재하지 않을때 NotFoundError 발생', async () => {
      // --- 준비 (Arrange) ---
      inquiryRepository.findInquiryById.mockResolvedValue(null);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(inquiryService.deleteInquiry(inquiryId, userId)).rejects.toThrow(
        '문의가 존재하지 않습니다.',
      );
    });

    it('문의를 삭제할 권한이 없을때 ForbiddenError 발생', async () => {
      // --- 준비 (Arrange) ---
      const mockFindInquiry_userId = {
        ...mockFindInquiry,
        userId: '다른 사용자 ID',
      };
      inquiryRepository.findInquiryById.mockResolvedValue(mockFindInquiry_userId);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(inquiryService.deleteInquiry(inquiryId, userId)).rejects.toThrow(
        '문의를 삭제할 권한이 없습니다.',
      );
    });
  });

  // 답변 생성
  describe('createReply', () => {
    it('답변 생성 성공', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        content: '답변 내용',
      };
      const mockReply = {
        id: replyId,
        inquiryId: inquiryId,
        userId: userId,
        content: data.content,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inquiryRepository.findInquiryById.mockResolvedValue(mockFindInquiry);
      inquiryRepository.createReply.mockResolvedValue(mockReply);

      // --- 실행 (Act) ---
      const result = await inquiryService.createReply(inquiryId, userId, data);

      const createData = {
        content: data.content,
        user: {
          connect: {
            id: userId,
          },
        },
        inquiry: {
          connect: {
            id: inquiryId,
          },
        },
      };
      const updateData = {
        status: InquiryStatus.CompletedAnswer,
      };

      // --- 검증 (Assert) ---
      expect(inquiryRepository.findInquiryById).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.findInquiryById).toHaveBeenCalledWith(inquiryId);
      expect(inquiryRepository.createReply).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.createReply).toHaveBeenCalledWith(createData, inquiryId, updateData);
      expect(result).toEqual(mockReply);
    });

    it('문의가 존재하지 않을때 NotFoundError 발생', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        content: '답변 내용',
      };
      inquiryRepository.findInquiryById.mockResolvedValue(null);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(inquiryService.createReply(inquiryId, userId, data)).rejects.toThrow(
        '문의가 존재하지 않습니다.',
      );
    });

    it('답변을 생성할 권한이 없을때 ForbiddenError 발생', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        content: '답변 내용',
      };
      const mockFindInquiry_userId = {
        ...mockFindInquiry,
        product: {
          store: {
            userId: '다른 사용자 ID',
          },
        },
      };
      inquiryRepository.findInquiryById.mockResolvedValue(mockFindInquiry_userId);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(inquiryService.createReply(inquiryId, userId, data)).rejects.toThrow(
        '답변을 생성할 권한이 없습니다.',
      );
    });
  });

  // 답변 수정
  describe('updateReply', () => {
    it('답변 수정 성공', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        content: '답변 내용 수정',
      };
      const mockReply = {
        id: replyId,
        ...data,
        inquiryId: inquiryId,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inquiryRepository.findReplyById.mockResolvedValue(mockFindReply);
      inquiryRepository.updateReply.mockResolvedValue(mockReply);

      // --- 실행 (Act) ---
      const result = await inquiryService.updateReply(replyId, userId, data);

      const updateData = {
        content: data.content,
      };

      // --- 검증 (Assert) ---
      expect(inquiryRepository.findReplyById).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.findReplyById).toHaveBeenCalledWith(replyId);
      expect(inquiryRepository.updateReply).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.updateReply).toHaveBeenCalledWith(replyId, updateData);
      expect(result).toEqual(mockReply);
    });

    it('답변이 존재하지 않을때 NotFoundError 발생', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        content: '답변 내용 수정',
      };
      inquiryRepository.findReplyById.mockResolvedValue(null);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(inquiryService.updateReply(replyId, userId, data)).rejects.toThrow(
        '답변이 존재하지 않습니다.',
      );
    });

    it('답변을 수정할 권한이 없을때 ForbiddenError 발생', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        content: '답변 내용 수정',
      };
      const mockFindReply_userId = {
        ...mockFindReply,
        userId: '다른 사용자 ID',
      };
      inquiryRepository.findReplyById.mockResolvedValue(mockFindReply_userId);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(inquiryService.updateReply(replyId, userId, data)).rejects.toThrow(
        '답변을 수정할 권한이 없습니다.',
      );
    });

    it('수정할 내용이 없을 때 BadRequestError 발생', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        content: mockFindReply.content,
      };
      inquiryRepository.findReplyById.mockResolvedValue(mockFindReply);

      // --- 실행 및 검증 (Act & Assert) ---
      await expect(inquiryService.updateReply(replyId, userId, data)).rejects.toThrow(
        '수정할 내용이 없습니다.',
      );
    });
  });
});
