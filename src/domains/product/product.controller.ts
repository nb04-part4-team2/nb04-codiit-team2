import { Request, Response } from 'express';
import { ProductService } from './product.service.js';
import { CreateProductDto, ProductListQueryDto } from './product.dto.js';
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

  getProducts = async (
    req: Request<Record<string, string>, unknown, unknown, unknown>,
    res: Response,
  ) => {
    const query = req.query as ProductListQueryDto;

    const result = await this.productService.getProducts(query);

    res.status(200).json(result);
  };
}
