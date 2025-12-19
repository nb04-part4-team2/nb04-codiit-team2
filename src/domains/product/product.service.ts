import { ProductRepository } from './product.repository.js';
import {
  CreateProductDto,
  DetailProductResponse,
  ProductListQueryDto,
  ProductListResponse,
  UpdateProductDto,
} from './product.dto.js';
import { ProductMapper } from './product.mapper.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/common/utils/errors.js';

export class ProductService {
  constructor(private productRepository: ProductRepository) {}

  // 상품 등록
  async createProduct(userId: string, data: CreateProductDto): Promise<DetailProductResponse> {
    const store = await this.productRepository.findStoreByUserId(userId);
    if (!store) {
      throw new NotFoundError('스토어를 찾을 수 없습니다.');
    }

    // [방어 코드] 카테고리 데이터 타입 불일치 방지
    if (!data.categoryName || typeof data.categoryName !== 'string') {
      throw new BadRequestError('유효하지 않은 카테고리 형식입니다.');
    }

    const category = await this.productRepository.findCategoryByName(data.categoryName);
    if (!category) {
      throw new NotFoundError('카테고리가 없습니다.');
    }

    // [방어 코드] 스키마(default 0)가 있지만 서비스 레벨에서 한 번 더 보장 (유지)
    const validatedDiscountRate =
      data.discountRate !== undefined && data.discountRate !== null ? data.discountRate : 0;

    const productDataForDb = {
      name: data.name,
      price: data.price,
      content: data.content,
      image: data.image,
      discountRate: validatedDiscountRate,
      discountStartTime: data.discountStartTime ? new Date(data.discountStartTime) : null,
      discountEndTime: data.discountEndTime ? new Date(data.discountEndTime) : null,
      categoryId: category.id,
      stocks: data.stocks,
    };

    const createdProduct = await this.productRepository.create(store.id, productDataForDb);
    const productDetail = await this.productRepository.findById(createdProduct.id);

    if (!productDetail) {
      throw new Error('상품 생성 후 조회에 실패했습니다.');
    }

    return ProductMapper.toDetailResponse(productDetail);
  }

  // 상품 목록 조회
  async getProducts(query: ProductListQueryDto): Promise<ProductListResponse> {
    const { products, totalCount } = await this.productRepository.findAll(query);
    return ProductMapper.toProductListResponse(products, totalCount);
  }

  // 상품 상세 조회
  async getProduct(productId: string): Promise<DetailProductResponse> {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new NotFoundError('상품을 찾을 수 없습니다.');
    }

    return ProductMapper.toDetailResponse(product);
  }

  // 상품 수정
  async updateProduct(
    userId: string,
    productId: string,
    data: UpdateProductDto,
  ): Promise<DetailProductResponse> {
    const productData = await this.productRepository.findProductOwnership(productId);

    if (!productData) {
      throw new NotFoundError('상품을 찾을 수 없습니다.');
    }
    if (!productData.store || productData.store.userId !== userId) {
      throw new ForbiddenError('상품 수정 권한이 없습니다.');
    }

    let categoryId: string | undefined = undefined;
    if (data.categoryName) {
      // [방어 코드] 카테고리 타입 체크 (수정 시에도 유효)
      if (typeof data.categoryName !== 'string') {
        throw new BadRequestError('유효하지 않은 카테고리 형식입니다.');
      }

      const category = await this.productRepository.findCategoryByName(data.categoryName);
      if (!category) {
        throw new NotFoundError('카테고리가 없습니다.');
      }
      categoryId = category.id;
    }

    const discountStartTime =
      data.discountStartTime === null
        ? null
        : data.discountStartTime
          ? new Date(data.discountStartTime)
          : undefined;
    const discountEndTime =
      data.discountEndTime === null
        ? null
        : data.discountEndTime
          ? new Date(data.discountEndTime)
          : undefined;

    // [수정] 불필요한 변수 선언 제거하고 data.discountRate 직접 사용
    const updatedProduct = await this.productRepository.update(productId, {
      name: data.name,
      price: data.price,
      content: data.content,
      image: data.image,
      discountRate: data.discountRate, // undefined면 Prisma가 무시(기존 값 유지)
      isSoldOut: data.isSoldOut,
      stocks: data.stocks,
      categoryId,
      discountStartTime,
      discountEndTime,
    });

    return ProductMapper.toDetailResponse(updatedProduct);
  }

  // 상품 삭제
  async deleteProduct(userId: string, productId: string): Promise<void> {
    // 상품 존재 여부 및 소유권 정보 조회
    const product = await this.productRepository.findProductOwnership(productId);

    // 상품이 존재하지 않는 경우
    if (!product) {
      throw new NotFoundError('상품을 찾을 수 없습니다.');
    }

    // 권한 검증: 요청한 유저가 해당 상품이 등록된 스토어의 주인이 아닌 경우
    if (product.store.userId !== userId) {
      throw new ForbiddenError('상품 삭제 권한이 없습니다.');
    }

    // 삭제 수행
    await this.productRepository.delete(productId);
  }
}
