// 빌드에 test를 포함하지않으면 vscode에서는 tsconfig만 확인하기 때문에 경로 별칭이 에러뜸
// Cannot find module '@/domains/cart/cart.service.js' or its corresponding type declarations.ts(2307)
// 하지만 jest.config.cjs에 설정된 매핑옵션이 있기 때문에 실제로 돌렸을 때는 에러가 발생하지 않음
import { CartService } from '../../src/domains/cart/cart.service';
import { CartRepository } from '../../src/domains/cart/cart.repository';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundError, ForbiddenError } from '../../src/common/utils/errors';
import { UserType } from '@prisma/client';

const mockCartRepo = {
  findByUserId: jest.fn(),
  findOwnerByUserId: jest.fn(),
} as unknown as jest.Mocked<CartRepository>;

describe('CartService', () => {
  let mockCartService: CartService;

  beforeEach(() => {
    jest.resetAllMocks();

    mockCartService = new CartService(mockCartRepo);
  });

  describe('장바구니 조회', () => {
    it('장바구니를 조회한다.', async () => {
      // given
      const userId = 'testBuyer1';
      const userType = UserType.BUYER;
      const date1 = new Date('2025-12-04T05:05:00.861Z');
      const date2 = new Date('2025-12-04T05:05:00.861Z');
      const cartResult = {
        id: 'testCart1',
        buyerId: 'testBuyer1',
        quantity: 1,
        createdAt: date1,
        updatedAt: date2,
        items: [
          {
            id: 'testItem1',
            cartId: 'testCart1',
            productId: 'testProduct1',
            sizeId: 1,
            quantity: 1,
            createdAt: date1,
            updatedAt: date2,
            product: {
              id: 'testProduct1',
              storeId: 'testStore1',
              name: '테스트 상품1',
              price: 10000,
              image: 'https://test.s3.ap-northeast-2.amazonaws.com/test/testImg1.jpg',
              discountRate: 0,
              discountStartTime: date1,
              discountEndTime: date1,
              createdAt: date1,
              updatedAt: date2,
              store: {
                id: 'testStore1',
                sellerId: 'testSeller1', // swagger 문서에서는 userId
                name: '테스트 스토어',
                address: '서울특별시',
                phoneNumber: '010-1234-1234',
                content: 'testContent',
                image: 'https://test.s3.ap-northeast-2.amazonaws.com/test/testImg2.jpg',
                createdAt: date1,
                updatedAt: date2,
              },
              stocks: [
                {
                  id: 'testStocks1',
                  productId: 'testProduct1',
                  sizeId: 2,
                  quantity: 1,
                  size: {
                    id: 2,
                    size: {
                      en: 's',
                      ko: '소',
                    },
                  },
                },
              ],
            },
          },
        ],
      };
      mockCartRepo.findByUserId.mockResolvedValue(cartResult);

      // when
      const result = await mockCartService.getCart(userId, userType);

      // then
      expect(result).toEqual(cartResult);
      expect(mockCartRepo.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockCartRepo.findByUserId).toHaveBeenCalledTimes(1);
    });
    // it('유저 아이디 형식이 잘못된 경우 400 에러 반환', async () => {}); -> 통합 테스트
    // it('로그인 하지 않은 사용자가 요청한 경우 401 에러 반환', async () => {}); -> 통합테스트
    it('seller 유저가 요청한 경우 403 에러 반환', async () => {
      // given
      const userId = 'testSeller1';
      const userType = UserType.SELLER;
      // when
      // then
      await expect(mockCartService.getCart(userId, userType)).rejects.toThrow(ForbiddenError);
    });
    it('해당 유저의 장바구니가 없는 경우 404 에러 반환', async () => {
      // given
      const userId = 'testBuyer1';
      const userType = UserType.BUYER;
      mockCartRepo.findByUserId.mockResolvedValue(null);
      // when
      // then
      await expect(mockCartService.getCart(userId, userType)).rejects.toThrow(NotFoundError);
    });
  });
});
