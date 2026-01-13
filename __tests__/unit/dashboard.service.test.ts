import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { DashboardService } from '../../src/domains/dashboard/dashboard.service.js';
import { DashboardRepository } from '../../src/domains/dashboard/dashboard.repository.js';
import { DashboardMapper } from '../../src/domains/dashboard/dashboard.mapper.js';
import { DashboardDto } from '../../src/domains/dashboard/dashboard.dto.js';
import {
  createSalesSummaryMock,
  createSalesChangeRateMock,
  createSalesPeriodMock,
  createTopSaleMock,
  // createPriceRangeSaleMock, // 제거
} from '../mocks/dashboard.mock.js';

describe('DashboardService', () => {
  let mockDashboardRepo: DeepMockProxy<DashboardRepository>;
  let mockDashboardMapper: DeepMockProxy<DashboardMapper>;
  let dashboardService: DashboardService;

  const userId = 'user-id-123';

  beforeEach(() => {
    jest.resetAllMocks();
    mockDashboardRepo = mockDeep<DashboardRepository>();
    mockDashboardMapper = mockDeep<DashboardMapper>();

    dashboardService = new DashboardService(mockDashboardRepo, mockDashboardMapper);

    mockDashboardMapper.toDto.mockImplementation((data: DashboardDto) => data);
  });

  describe('getDashboardData', () => {
    it('대시보드 데이터를 성공적으로 반환한다.', async () => {
      // Given (준비)
      const mockTodaySalesSummary = createSalesSummaryMock(10, 100000);
      const mockYesterdaySalesSummary = createSalesSummaryMock(5, 50000);
      const mockTodaySalesPeriod = createSalesPeriodMock(
        mockTodaySalesSummary,
        mockYesterdaySalesSummary,
        createSalesChangeRateMock(100, 100),
      );

      const mockWeekSalesSummary = createSalesSummaryMock(50, 500000);
      const mockLastWeekSalesSummary = createSalesSummaryMock(40, 400000);
      const mockWeekSalesPeriod = createSalesPeriodMock(
        mockWeekSalesSummary,
        mockLastWeekSalesSummary,
        createSalesChangeRateMock(25, 25),
      );

      const mockMonthSalesSummary = createSalesSummaryMock(200, 2000000);
      const mockLastMonthSalesSummary = createSalesSummaryMock(150, 1500000);
      const mockMonthSalesPeriod = createSalesPeriodMock(
        mockMonthSalesSummary,
        mockLastMonthSalesSummary,
        createSalesChangeRateMock(33, 33),
      );

      const mockYearSalesSummary = createSalesSummaryMock(1000, 10000000);
      const mockLastYearSalesSummary = createSalesSummaryMock(800, 8000000);
      const mockYearSalesPeriod = createSalesPeriodMock(
        mockYearSalesSummary,
        mockLastYearSalesSummary,
        createSalesChangeRateMock(25, 25),
      );

      const mockTopSellingProducts = [
        createTopSaleMock('prod-1', 'Product A', 10000, 50),
        createTopSaleMock('prod-2', 'Product B', 5000, 30),
      ];

      const mockSalesByPriceRangeRaw = [
        { priceRange: '1만원 이하', totalSales: 100000 },
        { priceRange: '1만원 ~ 3만원', totalSales: 200000 },
      ];
      const totalSalesForRanges = mockSalesByPriceRangeRaw.reduce(
        (acc, cur) => acc + cur.totalSales,
        0,
      );
      const mockSalesByPriceRange = mockSalesByPriceRangeRaw.map((item) => ({
        ...item,
        percentage: Math.round((item.totalSales / totalSalesForRanges) * 1000) / 10,
      }));

      // 레포지토리 메서드 Mocking
      mockDashboardRepo.getSalesSummary
        .mockResolvedValueOnce(mockTodaySalesSummary)
        .mockResolvedValueOnce(mockYesterdaySalesSummary)
        .mockResolvedValueOnce(mockWeekSalesSummary)
        .mockResolvedValueOnce(mockLastWeekSalesSummary)
        .mockResolvedValueOnce(mockMonthSalesSummary)
        .mockResolvedValueOnce(mockLastMonthSalesSummary)
        .mockResolvedValueOnce(mockYearSalesSummary)
        .mockResolvedValueOnce(mockLastYearSalesSummary);

      mockDashboardRepo.getTopSellingProducts.mockResolvedValue(mockTopSellingProducts);
      mockDashboardRepo.getSalesByPriceRange.mockResolvedValue(mockSalesByPriceRangeRaw);

      const expectedDashboardData: DashboardDto = {
        today: mockTodaySalesPeriod,
        week: mockWeekSalesPeriod,
        month: mockMonthSalesPeriod,
        year: mockYearSalesPeriod,
        topSales: mockTopSellingProducts,
        priceRange: mockSalesByPriceRange,
      };

      // When (실행)
      const result = await dashboardService.getDashboardData(userId);

      // Then (검증)
      expect(result).toEqual(expectedDashboardData);
      expect(mockDashboardRepo.getSalesSummary).toHaveBeenCalledTimes(8);
      expect(mockDashboardRepo.getTopSellingProducts).toHaveBeenCalledWith(5, userId);
      expect(mockDashboardRepo.getSalesByPriceRange).toHaveBeenCalledWith(userId);
      expect(mockDashboardMapper.toDto).toHaveBeenCalledWith(expect.any(Object));
    });

    it('이전 기간 데이터가 없을 때 변화율이 null 또는 0으로 처리되는지 확인한다.', async () => {
      // Given (준비)
      const mockCurrentSalesSummary = createSalesSummaryMock(100, 100000);
      const mockPreviousSalesSummaryZero = createSalesSummaryMock(0, 0);
      const mockPreviousSalesSummaryNonZeroOrdersZeroSales = createSalesSummaryMock(5, 0);

      mockDashboardRepo.getSalesSummary
        .mockResolvedValueOnce(mockCurrentSalesSummary)
        .mockResolvedValueOnce(mockPreviousSalesSummaryZero)
        .mockResolvedValueOnce(mockCurrentSalesSummary)
        .mockResolvedValueOnce(mockPreviousSalesSummaryNonZeroOrdersZeroSales)

        .mockResolvedValue(createSalesSummaryMock());

      mockDashboardRepo.getTopSellingProducts.mockResolvedValue([]);
      mockDashboardRepo.getSalesByPriceRange.mockResolvedValue([]);
      mockDashboardMapper.toDto.mockImplementation((data: DashboardDto) => data);

      // When (실행)
      const result = await dashboardService.getDashboardData(userId);

      // Then (검증)
      expect(result.today.changeRate.totalOrders).toBe(null);
      expect(result.today.changeRate.totalSales).toBe(null);

      expect(result.week.changeRate.totalOrders).not.toBe(null);
      expect(result.week.changeRate.totalSales).toBe(null);
    });

    it('데이터가 없을 때 빈 배열과 0으로 처리되는지 확인한다.', async () => {
      // Given (준비)
      const mockZeroSalesSummary = createSalesSummaryMock(0, 0);

      mockDashboardRepo.getSalesSummary.mockResolvedValue(mockZeroSalesSummary);
      mockDashboardRepo.getTopSellingProducts.mockResolvedValue([]);
      mockDashboardRepo.getSalesByPriceRange.mockResolvedValue([]);
      mockDashboardMapper.toDto.mockImplementation((data: DashboardDto) => data);

      // When (실행)
      const result = await dashboardService.getDashboardData(userId);

      // Then (검증)
      expect(result.today.current).toEqual(mockZeroSalesSummary);
      expect(result.today.previous).toEqual(mockZeroSalesSummary);
      expect(result.today.changeRate).toEqual(createSalesChangeRateMock(0, 0));

      expect(result.week.current).toEqual(mockZeroSalesSummary);
      expect(result.week.previous).toEqual(mockZeroSalesSummary);
      expect(result.week.changeRate).toEqual(createSalesChangeRateMock(0, 0));

      expect(result.month.current).toEqual(mockZeroSalesSummary);
      expect(result.month.previous).toEqual(mockZeroSalesSummary);
      expect(result.month.changeRate).toEqual(createSalesChangeRateMock(0, 0));

      expect(result.year.current).toEqual(mockZeroSalesSummary);
      expect(result.year.previous).toEqual(mockZeroSalesSummary);
      expect(result.year.changeRate).toEqual(createSalesChangeRateMock(0, 0));

      expect(result.topSales).toEqual([]);
      expect(result.priceRange).toEqual([]);
    });
  });
});
