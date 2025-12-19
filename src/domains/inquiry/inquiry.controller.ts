import type { Request, Response } from 'express';
import type { InquiryService } from './inquiry.service.js';
import { UnauthorizedError } from '@/common/utils/errors.js';
import {
  toGetInquiriesResponse,
  toCreateInquiryResponse,
  toGetAllInquiriesResponse,
  toGetInquiryByIdResponse,
  toUpdateInquiryResponse,
  toDeleteInquiryResponse,
  toCreateReplyResponse,
  toUpdateReplyResponse,
} from './inquiry.mapper.js';
import type { OffsetQuery } from './inquiry.dto.js';

export class InquiryController {
  constructor(private inquiryService: InquiryService) {}

  // 특정 상품의 모든 문의 조회
  public getInquiries = async (req: Request, res: Response) => {
    const { productId } = req.params;

    const inquiries = await this.inquiryService.getInquiries(productId);
    return res.status(200).json(toGetInquiriesResponse(inquiries));
  };

  // 문의 생성
  public createInquiry = async (req: Request, res: Response) => {
    const { productId } = req.params;

    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const userId = req.user.id;

    const data = req.body;
    const inquiry = await this.inquiryService.createInquiry(productId, userId, data);
    return res.status(201).json(toCreateInquiryResponse(inquiry));
  };

  // 모든 문의 조회 (사용자 본인의 문의)
  public getAllInquiries = async (req: Request, res: Response) => {
    const query = req.query as unknown as OffsetQuery;

    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const { id: userId, type: userType } = req.user;

    const inquiries = await this.inquiryService.getAllInquiries(query, userId, userType);
    return res.status(200).json(toGetAllInquiriesResponse(inquiries));
  };

  // 특정 문의 조회
  public getInquiryById = async (req: Request, res: Response) => {
    const { id } = req.params;

    const inquiry = await this.inquiryService.getInquiryById(id);
    return res.status(200).json(toGetInquiryByIdResponse(inquiry));
  };

  // 문의 수정
  public updateInquiry = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const userId = req.user.id;

    const data = req.body;
    const inquiry = await this.inquiryService.updateInquiry(id, userId, data);
    return res.status(200).json(toUpdateInquiryResponse(inquiry));
  };

  // 문의 삭제
  public deleteInquiry = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const userId = req.user.id;

    const inquiry = await this.inquiryService.deleteInquiry(id, userId);
    return res.status(200).json(toDeleteInquiryResponse(inquiry));
  };

  // 답변 생성
  public createReply = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const userId = req.user.id;

    const data = req.body;
    const reply = await this.inquiryService.createReply(id, userId, data);
    return res.status(201).json(toCreateReplyResponse(reply));
  };

  // 답변 수정
  public updateReply = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const userId = req.user.id;

    const data = req.body;
    const reply = await this.inquiryService.updateReply(id, userId, data);
    return res.status(200).json(toUpdateReplyResponse(reply));
  };
}
