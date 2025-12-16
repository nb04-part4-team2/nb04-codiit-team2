import type { Product, Inquiry, Reply } from '@prisma/client';
import { InquiryStatus } from '@prisma/client';

// ID
export const inquiryId = 'inquiry-id-1';
export const replyId = 'reply-id-1';
export const productId = 'product-id-1';
export const userId = 'user-id-1';
export const userId2 = 'user-id-2';
export const storeId = 'store-id-1';
export const categoryId = 'category-id-1';

// ============================================
// 목 데이터 팩토리 함수
// ============================================

// 상품 생성
export const createProductMock = (overrides: Partial<Product> = {}): Product => ({
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
  ...overrides,
});

// 문의 생성
export const createInquiryMock = (overrides: Partial<Inquiry> = {}): Inquiry => ({
  id: inquiryId,
  title: '문의 제목',
  content: '문의 내용',
  status: InquiryStatus.WaitingAnswer,
  isSecret: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: userId,
  productId: productId,
  ...overrides,
});

// 답변 생성
export const createReplyMock = (overrides: Partial<Reply> = {}): Reply => ({
  id: replyId,
  content: '답변 내용',
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: userId,
  inquiryId: inquiryId,
  ...overrides,
});

// ============================================
// Repository 목 데이터
// ============================================

// 특정 상품의 모든 문의 조회
export const mockInquiries = [
  {
    ...createInquiryMock({
      id: 'inquiry-1',
      userId: 'user-1',
    }),
    user: {
      name: '테스트 사용자 1',
    },
    reply: null,
  },
  {
    ...createInquiryMock({
      id: 'inquiry-2',
      userId: 'user-2',
    }),
    user: {
      name: '테스트 사용자 2',
    },
    reply: null,
  },
];

// 모든 문의 조회 (사용자 본인의 문의)
export const mockAllInquiries = [
  {
    id: 'inquiry-1',
    title: '문의 제목',
    content: '문의 내용',
    status: InquiryStatus.WaitingAnswer,
    isSecret: false,
    createdAt: new Date(),
    user: {
      id: userId,
      name: '테스트 사용자 1',
    },
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
    title: '문의 제목',
    content: '문의 내용',
    status: InquiryStatus.WaitingAnswer,
    isSecret: false,
    createdAt: new Date(),
    user: {
      id: userId,
      name: '테스트 사용자 1',
    },
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

// 특정 문의 조회
export const mockInquiry = {
  ...createInquiryMock(),
  reply: null,
};

// 상품 찾기
export const mockFindProduct = {
  ...createProductMock({
    id: productId,
    storeId,
    categoryId,
  }),
  store: {
    userId: userId2,
  },
};

// 문의 찾기
export const mockFindInquiry = {
  ...createInquiryMock({
    id: inquiryId,
    userId,
    productId,
  }),
  product: {
    name: '상품 이름',
    store: {
      userId,
    },
  },
};

export const mockInquiryOwnedByOtherUser = {
  ...mockFindInquiry,
  userId: 'other-user-id-1',
};

// 문의 상태 변경
export const mockUpdateInquiryStatus = {
  ...createInquiryMock({
    status: InquiryStatus.CompletedAnswer,
  }),
};

// 답변 찾기
export const mockFindReply = createReplyMock({
  id: replyId,
  userId,
  inquiryId,
});
