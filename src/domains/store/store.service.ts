import type { StoreRepository } from './store.repository.js';
import type { CreateStoreBody, UpdateStoreBody, StoreProductQuery } from './store.schema.js';
import type { ProductWithStock } from './store.mapper.js';
import { ConflictError, NotFoundError, ForbiddenError } from '@/common/utils/errors.js';
import { logger } from '@/config/logger.js';
import { env } from '@/config/constants.js';
import { SecurityEventType } from '@/common/types/securityEvents.type.js';
import { sanitizePhoneNumber, measureDuration } from '@/common/utils/loggerHelpers.js';

export class StoreService {
  constructor(private storeRepository: StoreRepository) {}

  // 스토어 생성
  async createStore(userId: string, data: CreateStoreBody) {
    // 이미 스토어가 있는지 확인
    const existingStore = await this.storeRepository.findByUserId(userId);
    if (existingStore) {
      logger.warn(
        {
          event: SecurityEventType.DUPLICATE_RESOURCE,
          userId,
          storeName: data.name,
        },
        'Store creation failed - duplicate store',
      );
      throw new ConflictError('이미 스토어를 보유하고 있습니다.');
    }

    // 스토어 생성
    const store = await this.storeRepository.create({
      ...data,
      user: { connect: { id: userId } },
    });

    logger.info(
      {
        event: 'STORE_CREATED',
        userId,
        storeId: store.id,
        storeName: store.name,
        phoneNumber: sanitizePhoneNumber(store.phoneNumber),
      },
      'Store created successfully',
    );

    return store;
  }

  // 스토어 상세 조회 (공개)
  async getStoreDetail(storeId: string) {
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      logger.warn(
        {
          event: SecurityEventType.RESOURCE_NOT_FOUND,
          storeId,
          resource: 'store',
        },
        'Store not found',
      );
      throw new NotFoundError('스토어를 찾을 수 없습니다.');
    }

    const favoriteCount = await this.storeRepository.countFavorites(storeId);

    return { store, favoriteCount };
  }

  // 내 스토어 상세 조회
  async getMyStoreDetail(userId: string) {
    const store = await this.storeRepository.findByUserId(userId);
    if (!store) {
      logger.warn(
        {
          event: SecurityEventType.RESOURCE_NOT_FOUND,
          userId,
          resource: 'store',
        },
        'Store not found for user',
      );
      throw new NotFoundError('스토어를 찾을 수 없습니다.');
    }

    const startTime = Date.now();

    const [productCount, favoriteCount, monthFavoriteCount, totalSoldCount] = await Promise.all([
      this.storeRepository.countProducts(store.id),
      this.storeRepository.countFavorites(store.id),
      this.storeRepository.countMonthFavorites(store.id),
      this.storeRepository.getTotalSoldCount(store.id),
    ]);

    const durationMs = measureDuration(startTime);

    logger.info(
      {
        event: 'MY_STORE_DETAIL_FETCHED',
        userId,
        storeId: store.id,
        durationMs,
        queryCount: 4,
      },
      `My store detail retrieved in ${durationMs}ms`,
    );

    if (durationMs > env.SLOW_QUERY_THRESHOLD_MS) {
      logger.warn(
        {
          event: SecurityEventType.SLOW_QUERY,
          userId,
          storeId: store.id,
          durationMs,
        },
        'Slow query detected in getMyStoreDetail',
      );
    }

    return {
      store,
      stats: { productCount, favoriteCount, monthFavoriteCount, totalSoldCount },
    };
  }

  // 내 스토어 상품 목록 조회
  async getMyStoreProducts(userId: string, query: StoreProductQuery) {
    const store = await this.storeRepository.findByUserId(userId);
    if (!store) {
      logger.warn(
        {
          event: SecurityEventType.RESOURCE_NOT_FOUND,
          userId,
          resource: 'store',
        },
        'Store not found for user',
      );
      throw new NotFoundError('스토어를 찾을 수 없습니다.');
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const startTime = Date.now();

    const [products, totalCount] = await Promise.all([
      this.storeRepository.findProductsWithStock(store.id, skip, pageSize),
      this.storeRepository.countProducts(store.id),
    ]);

    const durationMs = measureDuration(startTime);

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

    logger.info(
      {
        event: 'MY_STORE_PRODUCTS_FETCHED',
        userId,
        storeId: store.id,
        page,
        pageSize,
        totalCount,
        durationMs,
      },
      `Store products retrieved (page ${page})`,
    );

    if (durationMs > env.SLOW_QUERY_THRESHOLD_MS) {
      logger.warn(
        {
          event: SecurityEventType.SLOW_QUERY,
          userId,
          storeId: store.id,
          durationMs,
        },
        'Slow query detected in getMyStoreProducts',
      );
    }

    return { products: productsWithStock, totalCount };
  }

  // 스토어 수정 (본인 스토어만)
  async updateStore(storeId: string, userId: string, data: UpdateStoreBody) {
    // 스토어 존재 확인
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      logger.warn(
        {
          event: SecurityEventType.RESOURCE_NOT_FOUND,
          storeId,
          userId,
          resource: 'store',
        },
        'Store not found',
      );
      throw new NotFoundError('스토어를 찾을 수 없습니다.');
    }

    // 본인 스토어인지 확인
    if (store.userId !== userId) {
      logger.warn(
        {
          event: SecurityEventType.FORBIDDEN_ACCESS,
          userId,
          storeId,
          ownerId: store.userId,
          attemptedAction: 'update',
        },
        "User attempted to update another user's store",
      );
      throw new ForbiddenError('본인 스토어만 수정할 수 있습니다.');
    }

    // 스토어 수정
    const updatedStore = await this.storeRepository.update(storeId, data);

    logger.info(
      {
        event: 'STORE_UPDATED',
        userId,
        storeId,
        updatedFields: Object.keys(data),
      },
      'Store updated successfully',
    );

    return updatedStore;
  }

  // 관심 스토어 등록
  async registerFavorite(userId: string, storeId: string) {
    // 스토어 존재 확인
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      logger.warn(
        {
          event: SecurityEventType.RESOURCE_NOT_FOUND,
          storeId,
          userId,
          resource: 'store',
        },
        'Store not found',
      );
      throw new NotFoundError('스토어를 찾을 수 없습니다.');
    }

    // 이미 등록 여부 확인
    const existingFavorite = await this.storeRepository.findFavorite(userId, storeId);
    if (existingFavorite) {
      logger.warn(
        {
          event: SecurityEventType.DUPLICATE_RESOURCE,
          userId,
          storeId,
          resource: 'storeLike',
        },
        'Duplicate favorite registration',
      );
      throw new ConflictError('이미 관심 스토어로 등록되어 있습니다.');
    }

    // 관심 등록
    await this.storeRepository.createFavorite(userId, storeId);

    logger.info(
      {
        event: 'STORE_FAVORITE_REGISTERED',
        userId,
        storeId,
      },
      'Store favorite registered',
    );

    return store;
  }

  // 관심 스토어 해제
  async unregisterFavorite(userId: string, storeId: string) {
    // 스토어 존재 확인
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      logger.warn(
        {
          event: SecurityEventType.RESOURCE_NOT_FOUND,
          storeId,
          userId,
          resource: 'store',
        },
        'Store not found',
      );
      throw new NotFoundError('스토어를 찾을 수 없습니다.');
    }

    // 등록 여부 확인
    const existingFavorite = await this.storeRepository.findFavorite(userId, storeId);
    if (!existingFavorite) {
      logger.warn(
        {
          event: SecurityEventType.RESOURCE_NOT_FOUND,
          userId,
          storeId,
          resource: 'storeLike',
        },
        'Favorite not found',
      );
      throw new NotFoundError('관심 스토어로 등록되어 있지 않습니다.');
    }

    // 관심 해제
    await this.storeRepository.deleteFavorite(userId, storeId);

    logger.info(
      {
        event: 'STORE_FAVORITE_UNREGISTERED',
        userId,
        storeId,
      },
      'Store favorite unregistered',
    );

    return store;
  }
}
