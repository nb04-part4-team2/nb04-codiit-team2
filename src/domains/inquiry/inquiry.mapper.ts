import type {
  GetInquiriesRepository,
  GetInquiriesResponse,
  CreateInquiryRepository,
  CreateInquiryResponse,
  GetAllInquiriesRepository,
  GetAllInquiriesResponse,
  GetInquiryByIdRepository,
  GetInquiryByIdResponse,
  UpdateInquiryRepository,
  UpdateInquiryResponse,
  DeleteInquiryRepository,
  DeleteInquiryResponse,
  CreateReplyRepository,
  CreateReplyResponse,
  UpdateReplyRepository,
  UpdateReplyResponse,
} from './inquiry.dto.js';
import {
  getInquiriesSchema,
  createInquiryResponse,
  getAllInquiriesSchema,
  getInquiryByIdResponse,
  updateInquiryResponse,
  deleteInquiryResponse,
  createReplyResponse,
  updateReplyResponse,
} from './inquiry.dto.js';

// 특정 상품의 모든 문의 조회
export const toGetInquiriesResponse = (
  inquiries: GetInquiriesRepository[],
  totalCount: number,
): GetInquiriesResponse => ({
  list: inquiries.map((item) => getInquiriesSchema.parse(item)),
  totalCount: totalCount,
});

// 문의 생성
export const toCreateInquiryResponse = (
  inquiry: CreateInquiryRepository,
): CreateInquiryResponse => {
  return createInquiryResponse.parse(inquiry);
};

// 모든 문의 조회 (사용자 본인의 문의)
export const toGetAllInquiriesRespons = (
  inquiries: GetAllInquiriesRepository[],
  totalCount: number,
): GetAllInquiriesResponse => ({
  list: inquiries.map((item) => getAllInquiriesSchema.parse(item)),
  totalCount: totalCount,
});

// 특정 문의 조회
export const toGetInquiryByIdResponse = (
  inquiry: GetInquiryByIdRepository,
): GetInquiryByIdResponse => {
  return getInquiryByIdResponse.parse(inquiry);
};

// 문의 수정
export const toUpdateInquiryResponse = (
  inquiry: UpdateInquiryRepository,
): UpdateInquiryResponse => {
  return updateInquiryResponse.parse(inquiry);
};

// 문의 삭제
export const toDeleteInquiryResponse = (
  inquiry: DeleteInquiryRepository,
): DeleteInquiryResponse => {
  return deleteInquiryResponse.parse(inquiry);
};

// 답변 생성
export const toCreateReplyResponse = (inquiry: CreateReplyRepository): CreateReplyResponse => {
  return createReplyResponse.parse(inquiry);
};

// 답변 수정
export const toUpdateReplyResponse = (inquiry: UpdateReplyRepository): UpdateReplyResponse => {
  return updateReplyResponse.parse(inquiry);
};
