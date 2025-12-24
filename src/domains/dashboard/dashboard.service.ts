import { DashboardRepository } from './dashboard.repository.js';
import { DashboardMapper } from './dashboard.mapper.js';
import { DashboardDto, SalesPeriod } from './dashboard.dto.js';
import {
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfYear,
  getEndOfYear,
} from '../../common/utils/date.util.js';

const TOP_SELLING_PRODUCTS_LIMIT = 5;

export class DashboardService {
  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly dashboardMapper: DashboardMapper,
  ) {}

  private calculateChangeRate(current: number, previous: number): number | null {
    if (previous === 0) {
      if (current > 0) return null; // 이전 값이 0이고 현재 값이 0보다 크면, 성장률을 계산할 수 없으므로 null을 반환합니다.
      return 0; // 이전 값과 현재 값이 모두 0이면, 변화가 없으므로 0을 반환합니다.
    }
    const rate = ((current - previous) / previous) * 100;
    return Math.round(rate);
  }

  private async getSalesPeriod(
    currentRange: { start: Date; end: Date },
    previousRange: { start: Date; end: Date },
  ): Promise<SalesPeriod> {
    const [current, previous] = await Promise.all([
      this.dashboardRepository.getSalesSummary(currentRange.start, currentRange.end),
      this.dashboardRepository.getSalesSummary(previousRange.start, previousRange.end),
    ]);

    const changeRate = {
      totalOrders: this.calculateChangeRate(current.totalOrders, previous.totalOrders),
      totalSales: this.calculateChangeRate(current.totalSales, previous.totalSales),
    };

    return { current, previous, changeRate };
  }

  async getDashboardData(): Promise<DashboardDto> {
    // 1. Define date ranges safely without mutation
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const thisWeekStart = getStartOfWeek(new Date());
    const thisWeekEnd = getEndOfWeek(new Date());

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekEnd);
    lastWeekEnd.setDate(thisWeekEnd.getDate() - 7);

    const thisMonthStart = getStartOfMonth(new Date());
    const thisMonthEnd = getEndOfMonth(new Date());

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStart = getStartOfMonth(lastMonth);
    const lastMonthEnd = getEndOfMonth(lastMonth);

    const thisYearStart = getStartOfYear(new Date());
    const thisYearEnd = getEndOfYear(new Date());

    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    const lastYearStart = getStartOfYear(lastYear);
    const lastYearEnd = getEndOfYear(lastYear);

    const todayRange = { start: getStartOfDay(today), end: getEndOfDay(today) };
    const yesterdayRange = { start: getStartOfDay(yesterday), end: getEndOfDay(yesterday) };
    const thisWeekRange = { start: thisWeekStart, end: thisWeekEnd };
    const lastWeekRange = { start: lastWeekStart, end: lastWeekEnd };
    const thisMonthRange = { start: thisMonthStart, end: thisMonthEnd };
    const lastMonthRange = { start: lastMonthStart, end: lastMonthEnd };
    const thisYearRange = { start: thisYearStart, end: thisYearEnd };
    const lastYearRange = { start: lastYearStart, end: lastYearEnd };

    // 2. Fetch data from repository
    const [todayData, weekData, monthData, yearData, topSales, priceRangeData] = await Promise.all([
      this.getSalesPeriod(todayRange, yesterdayRange),
      this.getSalesPeriod(thisWeekRange, lastWeekRange),
      this.getSalesPeriod(thisMonthRange, lastMonthRange),
      this.getSalesPeriod(thisYearRange, lastYearRange),
      this.dashboardRepository.getTopSellingProducts(TOP_SELLING_PRODUCTS_LIMIT),
      this.dashboardRepository.getSalesByPriceRange(),
    ]);

    // 3. Process price range percentages
    const totalSalesFromRanges = priceRangeData.reduce((acc, cur) => acc + cur.totalSales, 0);
    const priceRange = priceRangeData.map((item) => ({
      ...item,
      percentage:
        totalSalesFromRanges === 0
          ? 0
          : Math.round((item.totalSales / totalSalesFromRanges) * 1000) / 10,
    }));

    // 4. Assemble and return DTO
    return this.dashboardMapper.toDto({
      today: todayData,
      week: weekData,
      month: monthData,
      year: yearData,
      topSales,
      priceRange,
    });
  }
}
