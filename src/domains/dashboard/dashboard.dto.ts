export interface SalesSummary {
  totalOrders: number;
  totalSales: number;
}

export interface SalesChangeRate {
  totalOrders: number | null;
  totalSales: number | null;
}

export interface SalesPeriod {
  current: SalesSummary;
  previous: SalesSummary;
  changeRate: SalesChangeRate;
}

export interface TopSale {
  totalOrders: number;
  product: {
    id: string;
    name: string;
    price: number;
  };
}

export interface PriceRangeSale {
  priceRange: string;
  totalSales: number;
  percentage: number;
}

export interface DashboardDto {
  today: SalesPeriod;
  week: SalesPeriod;
  month: SalesPeriod;
  year: SalesPeriod;
  topSales: TopSale[];
  priceRange: PriceRangeSale[];
}
