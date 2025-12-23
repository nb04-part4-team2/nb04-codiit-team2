import prisma from '@/config/prisma.js';
import { OrderStatus } from '@prisma/client';

const COMPLETED_ORDER_STATUSES: OrderStatus[] = ['CompletedPayment', 'Delivered'];

export class DashboardRepository {
  async getSalesSummary(startDate: Date, endDate: Date) {
    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: COMPLETED_ORDER_STATUSES,
      },
    };

    const totalOrders = await prisma.order.count({ where });

    const totalSalesAggregate = await prisma.payment.aggregate({
      _sum: {
        price: true,
      },
      where: {
        order: where,
      },
    });

    return {
      totalOrders,
      totalSales: totalSalesAggregate._sum.price || 0,
    };
  }

  async getTopSellingProducts(limit: number) {
    const topProductsRaw = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: {
            in: COMPLETED_ORDER_STATUSES,
          },
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    if (topProductsRaw.length === 0) {
      return [];
    }

    const productIds = topProductsRaw.map((p) => p.productId);

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });

    // Combine the results
    const productMap = new Map(products.map((p) => [p.id, p]));

    return topProductsRaw.map((raw) => ({
      totalOrders: raw._sum.quantity || 0,
      product: productMap.get(raw.productId)!,
    }));
  }

  async getSalesByPriceRange() {
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: {
            in: COMPLETED_ORDER_STATUSES,
          },
        },
      },
      select: {
        price: true,
        quantity: true,
      },
    });

    const priceRanges = {
      '1만원 이하': { totalSales: 0, minPrice: 0 },
      '1만원 ~ 3만원': { totalSales: 0, minPrice: 10001 },
      '3만원 ~ 5만원': { totalSales: 0, minPrice: 30001 },
      '5만원 ~ 10만원': { totalSales: 0, minPrice: 50001 },
      '10만원 이상': { totalSales: 0, minPrice: 100001 },
    };

    for (const item of orderItems) {
      const sale = item.price * item.quantity;
      if (item.price <= 10000) {
        priceRanges['1만원 이하'].totalSales += sale;
      } else if (item.price <= 30000) {
        priceRanges['1만원 ~ 3만원'].totalSales += sale;
      } else if (item.price <= 50000) {
        priceRanges['3만원 ~ 5만원'].totalSales += sale;
      } else if (item.price <= 100000) {
        priceRanges['5만원 ~ 10만원'].totalSales += sale;
      } else {
        priceRanges['10만원 이상'].totalSales += sale;
      }
    }

    return Object.entries(priceRanges)
      .map(([priceRange, data]) => ({
        priceRange,
        totalSales: data.totalSales,
        minPrice: data.minPrice,
      }))
      .sort((a, b) => a.minPrice - b.minPrice)
      .map(({ priceRange, totalSales }) => ({ priceRange, totalSales }));
  }
}
