import {
  SalesSummary,
  SalesChangeRate,
  SalesPeriod,
  TopSale,
  PriceRangeSale,
} from '../../src/domains/dashboard/dashboard.dto.js';

export const createSalesSummaryMock = (totalOrders = 0, totalSales = 0): SalesSummary => ({
  totalOrders,
  totalSales,
});

export const createSalesChangeRateMock = (
  totalOrders: number | null = 0,
  totalSales: number | null = 0,
): SalesChangeRate => ({
  totalOrders,
  totalSales,
});

export const createSalesPeriodMock = (
  currentSummary?: SalesSummary,
  previousSummary?: SalesSummary,
  changeRate?: SalesChangeRate,
): SalesPeriod => ({
  current: currentSummary || createSalesSummaryMock(),
  previous: previousSummary || createSalesSummaryMock(),
  changeRate: changeRate || createSalesChangeRateMock(),
});

export const createTopSaleMock = (
  id: string,
  name: string,
  price: number,
  totalOrders: number,
): TopSale => ({
  totalOrders,
  product: { id, name, price },
});

export const createPriceRangeSaleMock = (
  range: string,
  totalSales: number,
  percentage: number,
): PriceRangeSale => ({
  priceRange: range,
  totalSales,
  percentage,
});
