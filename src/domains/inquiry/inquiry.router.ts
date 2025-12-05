import { Router } from 'express';
import { asyncHandler } from '@/common/middlewares/asyncHandler.js';
import { validate } from '@/common/middlewares/validate.middleware.js';
import { inquiryController } from './inquiry.container.js';
import { mockAuthMiddleware } from '@/common/middlewares/mock.auth.middleware.js';
import {
  idSchema,
  productIdSchema,
  offsetSchema,
  createInquiry,
  updateInquiry,
} from './inquiry.dto.js';

const nestedInquiryRouter = Router({ mergeParams: true });
const inquiryRouter = Router();

// 특정 상품의 모든 문의 조회, 생성
nestedInquiryRouter
  .route('/')
  .get(
    validate(productIdSchema, 'params'),
    // validate(offsetSchema, 'query'), 배포 사이트에는 페이지 네이션이 없는데 나중에 추가 해야 할듯함
    asyncHandler(inquiryController.getInquiries),
  )
  .post(
    mockAuthMiddleware,
    // authenticate,
    validate(productIdSchema, 'params'),
    validate(createInquiry, 'body'),
    asyncHandler(inquiryController.createInquiry),
  );

// 모든 문의 조회 (사용자 본인의 문의)
inquiryRouter.get(
  '/',
  mockAuthMiddleware,
  // authenticate,
  validate(offsetSchema, 'query'),
  asyncHandler(inquiryController.getAllInquiries),
);

// 특정 문의 조회, 수정, 삭제
inquiryRouter
  .route('/:id')
  .get(
    mockAuthMiddleware,
    // authenticate,
    validate(idSchema, 'params'),
    asyncHandler(inquiryController.getInquiry),
  )
  .patch(
    mockAuthMiddleware,
    // authenticate,
    validate(idSchema, 'params'),
    validate(updateInquiry, 'body'),
    asyncHandler(inquiryController.updateInquiry),
  )
  .delete(
    mockAuthMiddleware,
    // authenticate,
    validate(idSchema, 'params'),
    asyncHandler(inquiryController.deleteInquiry),
  );

// TODO : 답변 로직 추가
// 답변
// inquiryRouter
//   .route('/:id/replies')
//   .get(
//     validate(idSchema, 'params'),
//     asyncHandler(inquiryController.getReply),
//   )
//   .post(
//     validate(idSchema, 'params'),
//     validate(createReply, 'body'),
//     asyncHandler(inquiryController.createReply),
//   )
//   .patch(
//     validate(idSchema, 'params'),
//     validate(updateReply, 'body'),
//     asyncHandler(inquiryController.updateReply),
//   );

export { inquiryRouter, nestedInquiryRouter };
