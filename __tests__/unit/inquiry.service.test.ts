import { jest } from '@jest/globals';
import type { PrismaClient, Prisma, Notification } from '@prisma/client';
import { InquiryRepository } from '../../src/domains/inquiry/inquiry.repository.js';
import { InquiryService } from '../../src/domains/inquiry/inquiry.service.js';
import { NotificationService } from '../../src/domains/notification/notification.service.js';
import { InquiryStatus } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { inquiryId, replyId, productId, userId } from '../mocks/inquiry.mock.js';
import {
  createInquiryMock,
  createReplyMock,
  mockInquiries,
  mockAllInquiries,
  mockInquiry,
  mockFindProduct,
  mockFindInquiry,
  mockInquiryOwnedByOtherUser,
  mockUpdateInquiryStatus,
  mockFindReply,
} from '../mocks/inquiry.mock.js';
import { createNotificationMock } from '../mocks/notification.mock.js';
import type { TxMock } from '../helpers/test.type.js';
import { sseManager } from '../../src/common/utils/sse.manager.js';

// sse 타입 정의
type SendMessageFn = (userId: string, message: Notification) => void;

describe('InquiryService 유닛 테스트', () => {
  let inquiryService: InquiryService;
  let inquiryRepository: DeepMockProxy<InquiryRepository>;
  let notificationService: DeepMockProxy<NotificationService>;
  let prisma: DeepMockProxy<PrismaClient>;
  let sendMessageSpy: SendMessageFn & jest.Mock;

  // 테스트 케이스가 실행되기 전에 매번 실행
  beforeEach(() => {
    // 의존성 주입
    inquiryRepository = mockDeep<InquiryRepository>();
    notificationService = mockDeep<NotificationService>();
    prisma = mockDeep<PrismaClient>();
    inquiryService = new InquiryService(inquiryRepository, notificationService, prisma);

    // sse 스파이
    sendMessageSpy = jest
      .spyOn(sseManager, 'sendMessage')
      .mockImplementation(() => {}) as SendMessageFn & jest.Mock;
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
    it('문의 생성 성공 (타인 상품에 문의하여 알림 생성)', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        title: '문의 제목',
        content: '문의 내용',
        isSecret: false,
      };
      const mockInquiry = createInquiryMock(data);
      const mockNotification = createNotificationMock();
      inquiryRepository.findProductByProductId.mockResolvedValue(mockFindProduct);
      (prisma.$transaction as jest.MockedFunction<TxMock>).mockImplementation(async (cb) =>
        cb(prisma as Prisma.TransactionClient),
      );
      inquiryRepository.createInquiry.mockResolvedValue(mockInquiry);
      notificationService.createNotification.mockResolvedValue(mockNotification);

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

      const notificationData = {
        userId: mockFindProduct.store.userId,
        content: `${mockFindProduct.name}에 새로운 문의가 등록되었습니다.`,
      };

      // --- 검증 (Assert) ---
      expect(inquiryRepository.findProductByProductId).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.findProductByProductId).toHaveBeenCalledWith(productId);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.createInquiry).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.createInquiry).toHaveBeenCalledWith(createData, prisma);
      expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
      expect(notificationService.createNotification).toHaveBeenCalledWith(notificationData, prisma);
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(sendMessageSpy).toHaveBeenCalledWith(mockNotification.userId, mockNotification);
      expect(result).toEqual(mockInquiry);
    });

    it('문의 생성 성공 (자신 상품에 문의하여 알림이 생성되지 않음)', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        title: '문의 제목',
        content: '문의 내용',
        isSecret: false,
      };
      const mockInquiry = createInquiryMock(data);
      const mockFindProductSameUser = {
        ...mockFindProduct,
        store: {
          ...mockFindProduct.store,
          userId,
        },
      };
      inquiryRepository.findProductByProductId.mockResolvedValue(mockFindProductSameUser);
      (prisma.$transaction as jest.MockedFunction<TxMock>).mockImplementation(async (cb) =>
        cb(prisma as Prisma.TransactionClient),
      );
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
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.createInquiry).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.createInquiry).toHaveBeenCalledWith(createData, prisma);
      expect(notificationService.createNotification).not.toHaveBeenCalled();
      expect(sendMessageSpy).not.toHaveBeenCalled();
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
      inquiryRepository.getAllInquiries.mockResolvedValue(mockAllInquiries);
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
        list: mockAllInquiries,
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
      const mockInquiry = createInquiryMock(data);
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
      const mockInquiry = createInquiryMock();
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
    it('답변 생성 성공 (타인 문의에 답변하여 알림 생성)', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        content: '답변 내용',
      };
      const mockReply = createReplyMock(data);
      const mockNotification = createNotificationMock();
      inquiryRepository.findInquiryById.mockResolvedValue(mockInquiryOwnedByOtherUser);
      (prisma.$transaction as jest.MockedFunction<TxMock>).mockImplementation(async (cb) =>
        cb(prisma as Prisma.TransactionClient),
      );
      inquiryRepository.createReply.mockResolvedValue(mockReply);
      inquiryRepository.updateStatusInquiry.mockResolvedValue(mockUpdateInquiryStatus);
      notificationService.createNotification.mockResolvedValue(mockNotification);

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

      const notificationData = {
        userId: mockInquiryOwnedByOtherUser.userId,
        content: `${mockInquiryOwnedByOtherUser.product.name}에 대한 문의에 답변이 달렸습니다.`,
      };

      // --- 검증 (Assert) ---
      expect(inquiryRepository.findInquiryById).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.findInquiryById).toHaveBeenCalledWith(inquiryId);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.createReply).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.createReply).toHaveBeenCalledWith(createData, prisma);
      expect(inquiryRepository.updateStatusInquiry).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.updateStatusInquiry).toHaveBeenCalledWith(
        updateData,
        inquiryId,
        prisma,
      );
      expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
      expect(notificationService.createNotification).toHaveBeenCalledWith(notificationData, prisma);
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      expect(sendMessageSpy).toHaveBeenCalledWith(mockNotification.userId, mockNotification);
      expect(result).toEqual(mockReply);
    });

    it('답변 생성 성공 (자신 문의에 답변하여 알림이 생성되지 않음)', async () => {
      // --- 준비 (Arrange) ---
      const data = {
        content: '답변 내용',
      };
      const mockReply = createReplyMock(data);
      inquiryRepository.findInquiryById.mockResolvedValue(mockFindInquiry);
      (prisma.$transaction as jest.MockedFunction<TxMock>).mockImplementation(async (cb) =>
        cb(prisma as Prisma.TransactionClient),
      );
      inquiryRepository.createReply.mockResolvedValue(mockReply);
      inquiryRepository.updateStatusInquiry.mockResolvedValue(mockUpdateInquiryStatus);

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
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.createReply).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.createReply).toHaveBeenCalledWith(createData, prisma);
      expect(inquiryRepository.updateStatusInquiry).toHaveBeenCalledTimes(1);
      expect(inquiryRepository.updateStatusInquiry).toHaveBeenCalledWith(
        updateData,
        inquiryId,
        prisma,
      );
      expect(notificationService.createNotification).not.toHaveBeenCalled();
      expect(sendMessageSpy).not.toHaveBeenCalled();
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
          name: '상품 이름',
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
      const mockReply = createReplyMock(data);
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
