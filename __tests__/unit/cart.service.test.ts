// 빌드에 test를 포함하지않으면 vscode에서는 tsconfig만 확인하기 때문에 경로 별칭이 에러뜸
// Cannot find module '@/domains/cart/cart.service.js' or its corresponding type declarations.ts(2307)
// 하지만 jest.config.cjs에 설정된 매핑옵션이 있기 때문에 실제로 돌렸을 때는 에러가 발생하지 않음
import { CartService } from '../../src/domains/cart/cart.service';
import { CartRepository } from '../../src/domains/cart/cart.repository';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundError } from '../../src/common/utils/errors';
import { createCartBaseMock, createCartMock } from '../mocks/cart.mock.ts';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('CartService', () => {
  let mockCartRepo: DeepMockProxy<CartRepository>;
  let mockCartService: CartService;

  beforeEach(() => {
    jest.resetAllMocks();

    mockCartRepo = mockDeep<CartRepository>();
    mockCartService = new CartService(mockCartRepo);
  });

  describe('장바구니 조회', () => {
    it('장바구니를 조회한다.', async () => {
      // given
      const userId = 'buyer-id-1';
      const cartRawData = createCartMock();
      mockCartRepo.findByUserId.mockResolvedValue(cartRawData);

      // when
      const result = await mockCartService.getCart(userId);

      // then
      expect(result).toEqual(cartRawData);
      expect(mockCartRepo.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockCartRepo.findByUserId).toHaveBeenCalledTimes(1);
    });
    // it('유저 아이디 형식이 잘못된 경우 400 에러 반환', async () => {}); -> 통합 테스트
    // it('로그인 하지 않은 사용자가 요청한 경우 401 에러 반환', async () => {}); -> 통합테스트
    // it('seller 유저가 요청한 경우 403 에러 반환', async () => { -> 통합 테스트
    //   // given
    //   const userId = 'testSeller1';
    //   // when
    //   // then
    //   await expect(mockCartService.getCart(userId)).rejects.toThrow(ForbiddenError);
    // });
    it('해당 유저의 장바구니가 없는 경우 빈 배열 반환', async () => {
      // given
      const userId = 'buyer-id-1';
      mockCartRepo.findByUserId.mockResolvedValue(null);
      // when
      const result = await mockCartService.getCart(userId);
      // then
      expect(result).toEqual([]);
    });
    it('해당 유저의 장바구니에 아이템이 하나도 없는 경우 404 에러 반환', async () => {
      // given
      const userId = 'buyer-id-1';
      const cartResult = createCartMock({ items: [] });
      mockCartRepo.findByUserId.mockResolvedValue(cartResult);
      // when
      // then
      await expect(mockCartService.getCart(userId)).rejects.toThrow(NotFoundError);
    });
  });
  describe('장바구니 생성', () => {
    it('장바구니 생성', async () => {
      // given
      const userId = 'buyer-id-1';
      const cartRawData = createCartBaseMock();
      mockCartRepo.createCart.mockResolvedValue(cartRawData);

      // when
      const result = await mockCartService.createCart(userId);

      // then
      expect(result).toEqual(cartRawData);
      expect(mockCartRepo.createCart).toHaveBeenCalledWith(userId);
      expect(mockCartRepo.createCart).toHaveBeenCalledTimes(1);
    });
  });
});
