import { DashboardRepository } from './dashboard.repository.js';
import { DashboardMapper } from './dashboard.mapper.js';
import { DashboardDto, SalesPeriod } from './dashboard.dto.js';

// --- Date Helper Functions ---
const getStartOfDay = (date: Date) => new Date(date.setHours(0, 0, 0, 0));
const getEndOfDay = (date: Date) => new Date(date.setHours(23, 59, 59, 999));

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // adjust when day is sunday
  return getStartOfDay(new Date(d.setDate(diff)));
};

const getEndOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + 6;
  return getEndOfDay(new Date(d.setDate(diff)));
};

const getStartOfMonth = (date: Date) =>
  getStartOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
const getEndOfMonth = (date: Date) =>
  getEndOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));

const getStartOfYear = (date: Date) => getStartOfDay(new Date(date.getFullYear(), 0, 1));
const getEndOfYear = (date: Date) => getEndOfDay(new Date(date.getFullYear(), 11, 31));

export class DashboardService {
  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly dashboardMapper: DashboardMapper,
  ) {}

  private calculateChangeRate(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0; // Or handle as a special case, e.g., return null
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
      this.dashboardRepository.getTopSellingProducts(5),
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
