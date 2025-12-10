import type { Request, Response } from 'express';
import type { StoreService } from './store.service.js';
import {
  toStoreResponse,
  toStoreDetailResponse,
  toMyStoreDetailResponse,
  toMyStoreProductListResponse,
} from './store.mapper.js';
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

  // 스토어 상세 조회 (공개)
  getStoreDetail = async (req: Request, res: Response) => {
    const { storeId } = req.params;

    const { store, favoriteCount } = await this.storeService.getStoreDetail(storeId);

    res.status(200).json(toStoreDetailResponse(store, favoriteCount));
  };

  // 내 스토어 상세 조회
  getMyStoreDetail = async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const userId = req.user.id;

    const { store, stats } = await this.storeService.getMyStoreDetail(userId);

    res.status(200).json(toMyStoreDetailResponse(store, stats));
  };

  // 내 스토어 상품 목록 조회
  getMyStoreProducts = async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError('인증이 필요합니다.');
    const userId = req.user.id;

    const { products, totalCount } = await this.storeService.getMyStoreProducts(userId, req.query);

    res.status(200).json(toMyStoreProductListResponse(products, totalCount));
  };
}
