import { Request, Response } from 'express';
import { ReviewService } from './review.service.js';
import { CreateReviewDto } from './review.dto.js';
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
}
