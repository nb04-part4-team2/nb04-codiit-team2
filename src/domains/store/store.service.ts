import type { StoreRepository } from './store.repository.js';
import type { CreateStoreBody } from './store.schema.js';
import { ConflictError } from '@/common/utils/errors.js';

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
}
