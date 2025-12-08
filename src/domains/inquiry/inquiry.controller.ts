import type { Request, Response } from 'express';
import type { InquiryService } from './inquiry.service.js';
import { UnauthorizedError } from '@/common/utils/errors.js';

export class InquiryController {
  constructor(private inquiryService: InquiryService) {}

  // 특정 상품의 모든 문의
  public getInquiries = async (req: Request, res: Response) => {
    const { productId } = req.params;

    const inquiries = await this.inquiryService.getInquiries(productId);
    return res.status(200).json(inquiries);
  };

  // 특정 상품의 문의 생성
  public createInquiry = async (req: Request, res: Response) => {
    const { productId } = req.params;

    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const userId = req.user.id;

    const data = req.body;
    const inquiry = await this.inquiryService.createInquiry(productId, userId, data);
    return res.status(201).json(inquiry);
  };

  // 모든 문의 조회 (사용자 본인의 문의)
  public getAllInquiries = async (req: Request, res: Response) => {
    const query = req.query;

    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const userId = req.user.id;

    const inquiries = await this.inquiryService.getAllInquiries(query, userId);
    return res.status(200).json(inquiries);
  };

  // 특정 문의 조회
  public getInquiry = async (req: Request, res: Response) => {
    const { id } = req.params;

    const inquiry = await this.inquiryService.getInquiry(id);
    return res.status(200).json(inquiry);
  };

  // 특정 문의 수정
  public updateInquiry = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const userId = req.user.id;

    const data = req.body;
    const inquiry = await this.inquiryService.updateInquiry(id, userId, data);
    return res.status(200).json(inquiry);
  };

  // 특정 문의 삭제
  public deleteInquiry = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const userId = req.user.id;

    const inquiry = await this.inquiryService.deleteInquiry(id, userId);
    return res.status(200).json(inquiry);
  };

  // TODO : 답변 로직 추가
  // public getReply = async (req: Request, res: Response) => {
  //   const { id } = req.params;

  //   const replies = await this.inquiryService.getReply(id);
  //   return res.status(200).json(replies);
  // };

  // public createReply = async (req: Request, res: Response) => {
  //   const { id } = req.params;

  //   if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
  //   const userId = req.user.id;

  //   const data = req.body;
  //   const reply = await this.inquiryService.createReply(id, userId, data);
  //   return res.status(201).json(reply);
  // };

  // public updateReply = async (req: Request, res: Response) => {
  //   const { id } = req.params;

  //   if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
  //   const userId = req.user.id;

  //   const data = req.body;
  //   const reply = await this.inquiryService.updateReply(id, userId, data);
  //   return res.status(200).json(reply);
  // };
}
