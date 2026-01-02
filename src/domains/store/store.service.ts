import type { StoreRepository } from './store.repository.js';
import type { CreateStoreBody, UpdateStoreBody, StoreProductQuery } from './store.schema.js';
import type { ProductWithStock } from './store.mapper.js';
import { ConflictError, NotFoundError, ForbiddenError } from '@/common/utils/errors.js';

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
        (!product.discountStartTime || now >= product.discountStartTime) &&
        (!product.discountEndTime || now <= product.discountEndTime);

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

  // 스토어 수정 (본인 스토어만)
  async updateStore(storeId: string, userId: string, data: UpdateStoreBody) {
    // 스토어 존재 확인
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundError('스토어를 찾을 수 없습니다.');
    }

    // 본인 스토어인지 확인
    if (store.userId !== userId) {
      throw new ForbiddenError('본인 스토어만 수정할 수 있습니다.');
    }

    // 스토어 수정
    const updatedStore = await this.storeRepository.update(storeId, data);

    return updatedStore;
  }

  // 관심 스토어 등록
  async registerFavorite(userId: string, storeId: string) {
    // 스토어 존재 확인
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundError('스토어를 찾을 수 없습니다.');
    }

    // 이미 등록 여부 확인
    const existingFavorite = await this.storeRepository.findFavorite(userId, storeId);
    if (existingFavorite) {
      throw new ConflictError('이미 관심 스토어로 등록되어 있습니다.');
    }

    // 관심 등록
    await this.storeRepository.createFavorite(userId, storeId);

    return store;
  }

  // 관심 스토어 해제
  async unregisterFavorite(userId: string, storeId: string) {
    // 스토어 존재 확인
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundError('스토어를 찾을 수 없습니다.');
    }

    // 등록 여부 확인
    const existingFavorite = await this.storeRepository.findFavorite(userId, storeId);
    if (!existingFavorite) {
      throw new NotFoundError('관심 스토어로 등록되어 있지 않습니다.');
    }

    // 관심 해제
    await this.storeRepository.deleteFavorite(userId, storeId);

    return store;
  }
}
