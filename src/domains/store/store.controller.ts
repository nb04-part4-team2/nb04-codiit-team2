import type { Request, Response } from 'express';
import type { StoreService } from './store.service.js';
import { toStoreResponse } from './store.mapper.js';
import { UnauthorizedError } from '@/common/utils/errors.js';

export class StoreController {
  constructor(private storeService: StoreService) {}

  // 스토어 생성
  createStore = async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const userId = req.user.id;

    const store = await this.storeService.createStore(userId, req.body);

    res.status(201).json(toStoreResponse(store));
  };
}
