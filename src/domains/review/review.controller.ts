import { Request, Response } from 'express';
import { ReviewService } from './review.service.js';
import { CreateReviewDto, ReviewListQueryDto } from './review.dto.js';
import { UnauthorizedError } from '@/common/utils/errors.js';

export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  create = async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError('로그인이 필요합니다.');
    }

    const userId = req.user.id;
    const { productId } = req.params;
    const requestBody = req.body as CreateReviewDto;

    const review = await this.reviewService.createReview(userId, productId, requestBody);

    res.status(201).json(review);
  };

  // 리뷰 상세 조회
  getReview = async (req: Request, res: Response) => {
    const { reviewId } = req.params;

    const review = await this.reviewService.getReview(reviewId);

    res.status(200).json(review);
  };

  getReviews = async (req: Request, res: Response) => {
    const { productId } = req.params;
    // 쿼리 파라미터는 Zod 미들웨어를 통과하며 타입 변환됨
    const query = req.query as unknown as ReviewListQueryDto;

    const result = await this.reviewService.getReviews(productId, query);

    res.status(200).json(result);
  };
}
