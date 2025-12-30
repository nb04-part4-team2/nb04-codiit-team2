import { testClient, authRequest } from '../helpers/testClient.js';
import { generateSellerToken, generateBuyerToken } from '../helpers/authHelper.js';
import { createTestContext, type TestContext } from '../helpers/dataFactory.js';
import { DashboardDto } from '../../src/domains/dashboard/dashboard.dto.js'; // DTO 타입 임포트

describe('Dashboard API Integration Test', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  describe('GET /api/dashboard - 대시보드 조회', () => {
    it('200: 판매자가 대시보드 데이터를 성공적으로 조회한다.', async () => {
      // Given (준비)
      const sellerToken = generateSellerToken(ctx.seller.id);

      // When (실행)
      const response = await authRequest(sellerToken).get('/api/dashboard');

      // Then (검증)
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      // DashboardDto의 기본적인 구조를 확인합니다.
      // 실제 데이터 값보다는 존재 여부나 타입 위주로 확인합니다.
      const dashboardData: DashboardDto = response.body;
      expect(dashboardData.today).toBeDefined();
      expect(dashboardData.today.current).toBeDefined();
      expect(dashboardData.today.previous).toBeDefined();
      expect(dashboardData.today.changeRate).toBeDefined();

      expect(dashboardData.week).toBeDefined();
      expect(dashboardData.month).toBeDefined();
      expect(dashboardData.year).toBeDefined();

      expect(dashboardData.topSales).toBeInstanceOf(Array);
      expect(dashboardData.priceRange).toBeInstanceOf(Array);
    });

    it('401: 인증되지 않은 사용자가 대시보드 조회 시도 시 실패한다.', async () => {
      // When (실행)
      const response = await testClient.get('/api/dashboard');

      // Then (검증)
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('인증 토큰이 필요합니다.');
    });

    it('403: 구매자가 대시보드 조회 시도 시 실패한다. (판매자 전용)', async () => {
      // Given (준비)
      const buyerToken = generateBuyerToken(ctx.buyer.id);

      // When (실행)
      const response = await authRequest(buyerToken).get('/api/dashboard');

      // Then (검증)
      expect(response.status).toBe(403);
      expect(response.body.message).toBe('접근 권한이 없습니다.');
    });

    // TODO: 추가적인 케이스 (예: 데이터가 없는 경우, 특정 기간의 데이터)는 필요에 따라 추가
  });
});
