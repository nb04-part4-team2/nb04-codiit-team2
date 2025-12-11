import { ProductRepository } from './product.repository.js';
import {
  CreateProductDto,
  DetailProductResponse,
  ProductListQueryDto,
  ProductListResponse,
} from './product.dto.js';
import { ProductMapper } from './product.mapper.js'; // 매퍼 임포트
import { NotFoundError } from '@/common/utils/errors.js';

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
    const product = await this.productRepository.create(store.id, productDataForDb);

    // 응답 반환 (Mapper 사용)
    return ProductMapper.toDetailResponse(product);
  }

  // 상품 목록 조회
  async getProducts(query: ProductListQueryDto): Promise<ProductListResponse> {
    // 레포지토리 호출
    // DTO(query)가 Repository Interface(FindProductsParams)와 구조적으로 호환되므로 바로 전달 가능
    const { products, totalCount } = await this.productRepository.findAll(query);

    // 매퍼를 통해 응답 DTO로 변환
    return ProductMapper.toProductListResponse(products, totalCount);
  }
}
