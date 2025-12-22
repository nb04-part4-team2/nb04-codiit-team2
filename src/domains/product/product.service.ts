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

  // 재고 중복 검증 헬퍼 함수
  private validateDuplicateStocks(stocks: { sizeId: number; quantity: number }[]) {
    const sizeIds = stocks.map((s) => s.sizeId);
    const uniqueSizeIds = new Set(sizeIds);
    if (sizeIds.length !== uniqueSizeIds.size) {
      throw new BadRequestError('중복된 사이즈 옵션이 존재합니다.');
    }
  }

  // 상품 등록
  async createProduct(userId: string, data: CreateProductDto): Promise<DetailProductResponse> {
    const store = await this.productRepository.findStoreByUserId(userId);
    if (!store) {
      throw new NotFoundError('스토어를 찾을 수 없습니다.');
    }

    // [방어 코드] 카테고리 데이터 타입 확인
    if (!data.categoryName || typeof data.categoryName !== 'string') {
      throw new BadRequestError('유효하지 않은 카테고리 형식입니다.');
    }
    // 재고 사이즈 중복 검증
    this.validateDuplicateStocks(data.stocks);

    // 할인율 기본값 처리
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
      categoryName: data.categoryName,
      stocks: data.stocks,
    };

    const createdProduct = await this.productRepository.create(store.id, productDataForDb);

    const productWithDetails = {
      ...createdProduct,
      inquiries: [],
      reviews: [],
    };
    return ProductMapper.toDetailResponse(productWithDetails);
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

    // 카테고리 조회 로직 제거 및 바로 할당
    if (data.categoryName && typeof data.categoryName !== 'string') {
      throw new BadRequestError('유효하지 않은 카테고리 형식입니다.');
    }

    // 재고가 포함된 요청이라면 중복 검증
    if (data.stocks) {
      this.validateDuplicateStocks(data.stocks);
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

    const updatedProduct = await this.productRepository.update(productId, {
      name: data.name,
      price: data.price,
      content: data.content,
      image: data.image,
      discountRate: data.discountRate,
      isSoldOut: data.isSoldOut,
      stocks: data.stocks,
      categoryName: data.categoryName,
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
