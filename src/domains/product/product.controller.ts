import { Request, Response } from 'express';
import { ProductService } from './product.service.js';
import { CreateProductDto } from './product.dto.js';
import { UnauthorizedError } from '@/common/utils/errors.js';

export class ProductController {
  constructor(private productService: ProductService) {}

  create = async (req: Request, res: Response) => {
    // 로그인 여부 확인
    if (!req.user) {
      throw new UnauthorizedError('로그인이 필요합니다.');
    }

    // 권한 검사는 라우터의 onlySeller 미들웨어에서 처리하므로 제거함

    const userId = req.user.id;
    const requestBody = req.body as CreateProductDto;

    const product = await this.productService.createProduct(userId, requestBody);

    res.status(201).json(product);
  };
}
