import { ProductRepository } from './product.repository.js';
import {
  CreateProductDto,
  DetailProductResponse,
  ProductListQueryDto,
  ProductListResponse,
  UpdateProductDto,
} from './product.dto.js';
import { ProductMapper } from './product.mapper.js';
import { NotFoundError, ForbiddenError } from '@/common/utils/errors.js';

export class ProductService {
  constructor(private productRepository: ProductRepository) {}

  // 상품 등록
  async createProduct(userId: string, data: CreateProductDto): Promise<DetailProductResponse> {
    // 스토어 검증
    const store = await this.productRepository.findStoreByUserId(userId);
    if (!store) {
      throw new NotFoundError('스토어를 찾을 수 없습니다.');
    }

    // 카테고리 검증
    const category = await this.productRepository.findCategoryByName(data.categoryName);
    if (!category) {
      throw new NotFoundError('카테고리가 없습니다.');
    }

    // DB 저장용 데이터 준비
    const productDataForDb = {
      name: data.name,
      price: data.price,
      content: data.content,
      image: data.image,
      discountRate: data.discountRate,
      discountStartTime: data.discountStartTime ? new Date(data.discountStartTime) : null,
      discountEndTime: data.discountEndTime ? new Date(data.discountEndTime) : null,
      categoryId: category.id,
      stocks: data.stocks,
    };

    // DB 저장
    const createdProduct = await this.productRepository.create(store.id, productDataForDb);

    // 매퍼의 타입 요구사항(ProductDetailWithRelations)을 충족하기 위해 생성된 ID로 상세 정보를 다시 조회하여 반환합니다.
    const productDetail = await this.productRepository.findById(createdProduct.id);

    if (!productDetail) {
      throw new Error('상품 생성 후 조회에 실패했습니다.');
    }

    // 응답 반환 (Mapper 사용)
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

    if (!productData.store) {
      throw new NotFoundError('상품에 연결된 스토어 정보가 없습니다.');
    }

    if (productData.store.userId !== userId) {
      throw new ForbiddenError('상품 수정 권한이 없습니다.');
    }

    // 카테고리 변경 시 검증 및 ID 조회
    let categoryId: string | undefined = undefined;
    if (data.categoryName) {
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

    const updatedProduct = await this.productRepository.update(productId, {
      name: data.name,
      price: data.price,
      content: data.content,
      image: data.image,
      discountRate: data.discountRate,
      isSoldOut: data.isSoldOut,
      stocks: data.stocks, // 재고는 필수값이므로 그대로 전달
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
