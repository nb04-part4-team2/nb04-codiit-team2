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
    const result: { priceRange: string; totalSales: number }[] = await prisma.$queryRaw`
        SELECT
          CASE
            WHEN T1.price <= 10000 THEN '1만원 이하'
            WHEN T1.price > 10000 AND T1.price <= 30000 THEN '1만원 ~ 3만원'
            WHEN T1.price > 30000 AND T1.price <= 50000 THEN '3만원 ~ 5만원'
            WHEN T1.price > 50000 AND T1.price <= 100000 THEN '5만원 ~ 10만원'
            ELSE '10만원 이상'
          END as "priceRange",
          SUM(CAST(T1.price AS BIGINT) * T1.quantity) as "totalSales"
        FROM "order_items" AS T1
        LEFT JOIN "orders" AS T2 ON T1."orderId" = T2.id
        WHERE T2.status IN ('CompletedPayment', 'Delivered')
        GROUP BY "priceRange"
        ORDER BY MIN(T1.price)
    `;

    // Prisma's $queryRaw with BigInt returns BigInt, we need to convert it to Number.
    return result.map((item) => ({ ...item, totalSales: Number(item.totalSales) }));
  }
}
