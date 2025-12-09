import type { StoreRepository } from './store.repository.js';
import type { CreateStoreBody, StoreProductQuery } from './store.schema.js';
import type { ProductWithStock } from './store.mapper.js';
import { ConflictError, NotFoundError } from '@/common/utils/errors.js';

export class StoreService {
  constructor(private storeRepository: StoreRepository) {}

  // 스토어 생성
  async createStore(userId: string, data: CreateStoreBody) {
    // 이미 스토어가 있는지 확인
    const existingStore = await this.storeRepository.findByUserId(userId);
    if (existingStore) {
      throw new ConflictError('이미 스토어를 보유하고 있습니다.');
    }

    // 스토어 생성
    const store = await this.storeRepository.create({
      ...data,
      user: { connect: { id: userId } },
    });

    return store;
  }

  // 스토어 상세 조회 (공개)
  async getStoreDetail(storeId: string) {
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundError('스토어를 찾을 수 없습니다.');
    }

    const favoriteCount = await this.storeRepository.countFavorites(storeId);

    return { store, favoriteCount };
  }

  // 내 스토어 상세 조회
  async getMyStoreDetail(userId: string) {
    const store = await this.storeRepository.findByUserId(userId);
    if (!store) {
      throw new NotFoundError('스토어를 찾을 수 없습니다.');
    }

    const [productCount, favoriteCount, monthFavoriteCount, totalSoldCount] = await Promise.all([
      this.storeRepository.countProducts(store.id),
      this.storeRepository.countFavorites(store.id),
      this.storeRepository.countMonthFavorites(store.id),
      this.storeRepository.getTotalSoldCount(store.id),
    ]);

    return {
      store,
      stats: { productCount, favoriteCount, monthFavoriteCount, totalSoldCount },
    };
  }

  // 내 스토어 상품 목록 조회
  async getMyStoreProducts(userId: string, query: StoreProductQuery) {
    const store = await this.storeRepository.findByUserId(userId);
    if (!store) {
      throw new NotFoundError('스토어를 찾을 수 없습니다.');
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const [products, totalCount] = await Promise.all([
      this.storeRepository.findProductsWithStock(store.id, skip, pageSize),
      this.storeRepository.countProducts(store.id),
    ]);

    // 재고 합계 계산 + isDiscount 판정
    const now = new Date();
    const productsWithStock: ProductWithStock[] = products.map((product) => {
      const stock = product.stocks.reduce((sum, s) => sum + s.quantity, 0);
      const isDiscount =
        product.discountRate > 0 &&
        product.discountStartTime !== null &&
        product.discountEndTime !== null &&
        product.discountStartTime <= now &&
        now <= product.discountEndTime;

      return {
        id: product.id,
        image: product.image,
        name: product.name,
        price: product.price,
        stock,
        isDiscount,
        createdAt: product.createdAt,
      };
    });

    return { products: productsWithStock, totalCount };
  }
}
