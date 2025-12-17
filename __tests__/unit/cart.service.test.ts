// 빌드에 test를 포함하지않으면 vscode에서는 tsconfig만 확인하기 때문에 경로 별칭이 에러뜸
// Cannot find module '@/domains/cart/cart.service.js' or its corresponding type declarations.ts(2307)
// 하지만 jest.config.cjs에 설정된 매핑옵션이 있기 때문에 실제로 돌렸을 때는 에러가 발생하지 않음
import { CartService } from '../../src/domains/cart/cart.service.js';
import { CartRepository } from '../../src/domains/cart/cart.repository.js';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../src/common/utils/errors.js';
import {
  createCartBaseMock,
  createCartItemDetailMock,
  createCartItemMock,
  createCartMock,
} from '../mocks/cart.mock.js';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('CartService', () => {
  let mockCartRepo: DeepMockProxy<CartRepository>;
  let mockPrisma: DeepMockProxy<PrismaClient>;
  let mockCartService: CartService;

  const userId = 'buyer-id-1';
  const productId = 'product-id-1';
  const cartId = 'cart-id-1';
  const cartItemId = 'cartItem-id-1';
  const sizeId = 1;
  const quantity = 1;
  const sizes = [
    {
      sizeId,
      quantity,
    },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    mockCartRepo = mockDeep<CartRepository>();
    mockPrisma = mockDeep<PrismaClient>();
    mockCartService = new CartService(mockCartRepo, mockPrisma);
  });

  describe('장바구니 조회', () => {
    it('장바구니를 조회한다.', async () => {
      // given
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
      mockCartRepo.findByUserId.mockResolvedValue(null);
      // when
      const result = await mockCartService.getCart(userId);
      // then
      expect(result).toEqual([]);
    });
    it('해당 유저의 장바구니에 아이템이 하나도 없는 경우 404 에러 반환', async () => {
      // given
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
  describe('장바구니 수정', () => {
    it('장바구니에 수정 (상품 추가 / 수량 변경)', async () => {
      // repo에서 upsert로 추가 혹은 수량 변경을 수행하기 때문에 서비스에서 로직은 동일함
      // 그래서 테스트 분기없이 한번만 수행
      // given
      const cartItemsRawData = [createCartItemMock()];
      mockCartRepo.findCartIdByUserId.mockResolvedValue({ id: 'cart-id-1' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });
      mockCartRepo.updateCart.mockResolvedValue(cartItemsRawData[0]);

      // when
      const result = await mockCartService.updateCart({ userId, productId, sizes });

      // then
      expect(result).toEqual(cartItemsRawData);
      expect(mockCartRepo.findCartIdByUserId).toHaveBeenCalledWith(userId);
      expect(mockCartRepo.updateCart).toHaveBeenCalledWith({
        tx: mockPrisma,
        cartId,
        productId,
        sizeId,
        quantity,
      });
      expect(mockCartRepo.updateCart).toHaveBeenCalledTimes(1);
    });
    it('장바구니가 없는 경우 400 에러 반환', async () => {
      // given
      mockCartRepo.findCartIdByUserId.mockResolvedValue(null);
      // when
      // then
      await expect(mockCartService.updateCart({ userId, productId, sizes })).rejects.toThrow(
        BadRequestError,
      );
    });
  });
  describe('장바구니 아이템 상세 조회', () => {
    it('아이템 상세 조회', async () => {
      // given
      const cartItemRawData = createCartItemDetailMock();
      mockCartRepo.findCartItemDetail.mockResolvedValue(cartItemRawData);

      // when
      const result = await mockCartService.getCartItem(userId, cartItemId);

      // then
      expect(result).toEqual(cartItemRawData);
      expect(mockCartRepo.findCartItemDetail).toHaveBeenCalledWith(cartItemId);
      expect(mockCartRepo.findCartItemDetail).toHaveBeenCalledTimes(1);
    });
    it('해당 유저 장바구니의 아이템이 아닌경우 403 에러 반환', async () => {
      // given
      const cartItemRawData = createCartItemDetailMock({
        cart: createCartBaseMock({
          buyerId: 'buyer-id-2',
        }),
      });
      mockCartRepo.findCartItemDetail.mockResolvedValue(cartItemRawData);
      // when
      // then
      await expect(mockCartService.getCartItem(userId, cartItemId)).rejects.toThrow(ForbiddenError);
    });
    it('해당 아이템이 없는 경우 404 에러 반환', async () => {
      // given
      mockCartRepo.findCartItemDetail.mockResolvedValue(null);
      // when
      // then
      await expect(mockCartService.getCartItem(userId, cartItemId)).rejects.toThrow(NotFoundError);
    });
  });
  describe('장바구니 아이템 삭제', () => {
    it('장바구니 아이템 삭제 성공', async () => {
      // given
      mockCartRepo.findCartItem.mockResolvedValue({ id: cartItemId, cart: { buyerId: userId } });
      // when
      await mockCartService.deleteCartItem(userId, cartItemId);

      // then
      expect(mockCartRepo.deleteCartItem).toHaveBeenCalledWith(cartItemId);
      expect(mockCartRepo.deleteCartItem).toHaveBeenCalledTimes(1);
      expect(mockCartRepo.findCartItem).toHaveBeenCalledWith(cartItemId);
      expect(mockCartRepo.findCartItem).toHaveBeenCalledTimes(1);
    });
    it('해당 유저 장바구니의 아이템이 아닌경우 403 에러 반환', async () => {
      // given
      mockCartRepo.findCartItem.mockResolvedValue({
        id: cartItemId,
        cart: { buyerId: 'buyer-id-2' },
      });
      // when
      // then
      await expect(mockCartService.deleteCartItem(userId, cartItemId)).rejects.toThrow(
        ForbiddenError,
      );
    });
    it('해당 아이템이 없는 경우 404 에러 반환', async () => {
      // given
      mockCartRepo.findCartItem.mockResolvedValue(null);
      // when
      // then
      await expect(mockCartService.deleteCartItem(userId, cartItemId)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
