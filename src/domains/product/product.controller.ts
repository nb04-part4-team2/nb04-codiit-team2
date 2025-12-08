import { Request, Response } from 'express';
import { ProductService } from './product.service.js';
import { CreateProductDto } from './product.dto.js';
import { UnauthorizedError, ForbiddenError } from '@/common/utils/errors.js';
import { UserType } from '@prisma/client';

export class ProductController {
  constructor(private productService: ProductService) {}

  create = async (req: Request, res: Response) => {
    // 로그인 여부 확인
    if (!req.user) {
      throw new UnauthorizedError('로그인이 필요합니다.');
    }

    // 권한(Role) 명시적 검사 추가
    if (req.user.type !== UserType.SELLER) {
      throw new ForbiddenError('상품 등록 권한이 없습니다. (판매자만 가능)');
    }

    const userId = req.user.id;
    const requestBody = req.body as CreateProductDto;

    const product = await this.productService.createProduct(userId, requestBody);

    res.status(201).json(product);
  };
}
