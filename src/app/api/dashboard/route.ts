import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // ── Sales totals ──
    const completedWhere = { status: 'COMPLETED' };

    const [todaySales, weeklySales, monthlySales, annualSales] = await Promise.all([
      db.order.aggregate({
        where: { ...completedWhere, createdAt: { gte: todayStart } },
        _sum: { totalAmount: true },
      }),
      db.order.aggregate({
        where: { ...completedWhere, createdAt: { gte: weekStart } },
        _sum: { totalAmount: true },
      }),
      db.order.aggregate({
        where: { ...completedWhere, createdAt: { gte: monthStart } },
        _sum: { totalAmount: true },
      }),
      db.order.aggregate({
        where: { ...completedWhere, createdAt: { gte: yearStart } },
        _sum: { totalAmount: true },
      }),
    ]);

    // ── Today's transaction count & avg order value ──
    const todayOrders = await db.order.findMany({
      where: { ...completedWhere, createdAt: { gte: todayStart } },
      select: { totalAmount: true },
    });

    const todayTransactions = todayOrders.length;
    const avgOrderValue =
      todayTransactions > 0
        ? todayOrders.reduce((sum, o) => sum + o.totalAmount, 0) / todayTransactions
        : 0;

    // ── Profit calculations ──
    const todayOrderItems = await db.orderItem.findMany({
      where: {
        order: { status: 'COMPLETED', createdAt: { gte: todayStart } },
      },
      select: { profit: true, costPrice: true, quantity: true },
    });

    const grossProfit = todayOrderItems.reduce((sum, item) => sum + item.profit, 0);
    const totalCosts = todayOrderItems.reduce(
      (sum, item) => sum + item.costPrice * item.quantity,
      0
    );
    const netProfit = grossProfit - totalCosts;

    // ── Refund total ──
    const refunds = await db.refund.aggregate({
      _sum: { amount: true },
    });

    // ── Hourly sales (6 AM – 10 PM) ──
    const todayAllOrders = await db.order.findMany({
      where: { status: 'COMPLETED', createdAt: { gte: todayStart } },
      select: { createdAt: true, totalAmount: true },
    });

    const hourlySales: { hour: string; sales: number; orders: number }[] = [];
    for (let h = 6; h <= 22; h++) {
      const hourOrders = todayAllOrders.filter((o) => {
        const orderHour = o.createdAt.getHours();
        return orderHour === h;
      });

      const ampm = h < 12 ? 'AM' : 'PM';
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;

      hourlySales.push({
        hour: `${displayHour}${ampm}`,
        sales: hourOrders.reduce((s, o) => s + o.totalAmount, 0),
        orders: hourOrders.length,
      });
    }

    // ── Daily sales (past 7 days) ──
    const past7Start = new Date(todayStart);
    past7Start.setDate(past7Start.getDate() - 6);

    const last7Orders = await db.order.findMany({
      where: { status: 'COMPLETED', createdAt: { gte: past7Start } },
      select: { createdAt: true, totalAmount: true },
    });

    const dailySales: { date: string; sales: number; orders: number }[] = [];
    for (let d = 6; d >= 0; d--) {
      const dayStart = new Date(todayStart);
      dayStart.setDate(dayStart.getDate() - d);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayOrders = last7Orders.filter(
        (o) => o.createdAt >= dayStart && o.createdAt < dayEnd
      );

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];

      dailySales.push({
        date: `${monthNames[dayStart.getMonth()]} ${dayStart.getDate()}`,
        sales: dayOrders.reduce((s, o) => s + o.totalAmount, 0),
        orders: dayOrders.length,
      });
    }

    // ── Best sellers (top 5 products by qty in past 7 days) ──
    const recentOrderItems = await db.orderItem.findMany({
      where: {
        order: { status: 'COMPLETED', createdAt: { gte: past7Start } },
      },
      select: { productId: true, productName: true, quantity: true, subtotal: true },
    });

    const productQtyMap = new Map<
      string,
      { productId: string; productName: string; totalQty: number }
    >();
    for (const item of recentOrderItems) {
      const existing = productQtyMap.get(item.productId);
      if (existing) {
        existing.totalQty += item.quantity;
      } else {
        productQtyMap.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          totalQty: item.quantity,
        });
      }
    }

    const sortedByQty = [...productQtyMap.values()].sort(
      (a, b) => b.totalQty - a.totalQty
    );

    const bestSellers = sortedByQty.slice(0, 5).map((p) => ({
      productId: p.productId,
      productName: p.productName,
      totalQty: p.totalQty,
    }));

    // ── Slow movers (bottom 5 with at least 1 sale in past 7 days) ──
    const slowMovers = sortedByQty
      .filter((p) => p.totalQty >= 1)
      .reverse()
      .slice(0, 5)
      .map((p) => ({
        productId: p.productId,
        productName: p.productName,
        totalQty: p.totalQty,
      }));

    // ── Category performance ──
    const categories = await db.category.findMany({
      select: { id: true, name: true },
    });

    const allProducts = await db.product.findMany({
      select: { id: true, name: true, categoryIds: true },
    });

    const productToCategories = new Map<string, string[]>();
    for (const product of allProducts) {
      try {
        productToCategories.set(product.id, JSON.parse(product.categoryIds));
      } catch {
        productToCategories.set(product.id, []);
      }
    }

    const categorySalesMap = new Map<string, number>();
    const categoryOrderMap = new Map<string, number>();

    for (const item of recentOrderItems) {
      const catIds = productToCategories.get(item.productId) || [];
      for (const catId of catIds) {
        const currentSales = categorySalesMap.get(catId) || 0;
        categorySalesMap.set(catId, currentSales + item.subtotal);

        const currentOrders = categoryOrderMap.get(catId) || 0;
        categoryOrderMap.set(catId, currentOrders + item.quantity);
      }
    }

    const categoryPerformance = categories
      .map((cat) => ({
        categoryId: cat.id,
        categoryName: cat.name,
        sales: categorySalesMap.get(cat.id) || 0,
        orderCount: categoryOrderMap.get(cat.id) || 0,
      }))
      .filter((c) => c.sales > 0)
      .sort((a, b) => b.sales - a.sales);

    // ── Low stock items ──
    const lowStockItems = await db.inventoryItem.findMany({
      where: { currentStock: { lte: 0 } },
      include: { product: { select: { id: true, name: true, sku: true } } },
      orderBy: { currentStock: 'asc' },
    });

    // ── Employee ranking (today's sales) ──
    const todayOrdersWithEmployee = await db.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: todayStart },
        employeeId: { not: null },
      },
      select: { employeeId: true, totalAmount: true },
    });

    const employeeSalesMap = new Map<string, number>();
    for (const o of todayOrdersWithEmployee) {
      if (o.employeeId) {
        employeeSalesMap.set(
          o.employeeId,
          (employeeSalesMap.get(o.employeeId) || 0) + o.totalAmount
        );
      }
    }

    const employeeRanking = await Promise.all(
      [...employeeSalesMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(async ([employeeId, totalSales]) => {
          const emp = await db.employee.findUnique({
            where: { id: employeeId },
            select: { id: true, name: true, role: true },
          });
          return {
            employeeId,
            employeeName: emp?.name ?? 'Unknown',
            employeeRole: emp?.role ?? '',
            totalSales,
          };
        })
    );

    return NextResponse.json({
      todaySales: todaySales._sum.totalAmount ?? 0,
      weeklySales: weeklySales._sum.totalAmount ?? 0,
      monthlySales: monthlySales._sum.totalAmount ?? 0,
      annualSales: annualSales._sum.totalAmount ?? 0,
      todayTransactions,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      refundTotal: refunds._sum.amount ?? 0,
      hourlySales,
      dailySales,
      bestSellers,
      slowMovers,
      categoryPerformance,
      lowStockItems: lowStockItems.map((item) => ({
        ...item,
        product: item.product ?? null,
        expiryDate: item.expiryDate?.toISOString() ?? null,
        lastRestocked: item.lastRestocked?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      employeeRanking,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}