import { Request, Response } from 'express';
import { ProductService } from './product.service.js';
import { CreateProductDto } from './product.dto.js';
import { UnauthorizedError } from '@/common/utils/errors.js';

export class ProductController {
  constructor(private productService: ProductService) {}

  create = async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError('로그인이 필요합니다.');
    }

    const userId = req.user.id;
    const requestBody = req.body as CreateProductDto;

    const product = await this.productService.createProduct(userId, requestBody);

    res.status(201).json(product);
  };
}
