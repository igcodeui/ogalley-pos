import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const orders = await db.order.findMany({
      where: { createdAt: { gte: start, lt: end }, status: 'COMPLETED' },
      include: { payments: true, items: true, employee: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const voided = await db.order.findMany({
      where: { createdAt: { gte: start, lt: end }, status: { in: ['VOID', 'REFUND'] } },
      select: { id: true, orderNumber: true, totalAmount: amount, status: true, notes: true, createdAt: true },
    });

    const openDrawer = await db.cashDrawer.findFirst({ where: { status: 'OPEN' }, orderBy: { openedAt: 'desc' } });

    let totalRevenue = 0, totalTax = 0, totalCost = 0, totalDiscount = 0, totalRefund = 0;
    const paymentMap: Record<string, { amount: number; count: number }> = {};
    const hourlyMap: Record<number, { revenue: number; orders: number }> = {};
    const employeeMap: Record<string, { name: string; sales: number; transactions: number }> = {};

    for (let h = 0; h < 24; h++) { hourlyMap[h] = { revenue: 0, orders: 0 }; }

    for (const order of orders) {
      totalRevenue += order.totalAmount;
      totalTax += order.taxAmount;
      totalDiscount += order.discountAmount;
      totalCost += order.items.reduce((s, item) => s + item.costPrice * item.quantity, 0);

      for (const pay of order.payments) {
        if (!paymentMap[pay.method]) paymentMap[pay.method] = { amount: 0, count: 0 };
        paymentMap[pay.method].amount += pay.amount;
        paymentMap[pay.method].count++;
      }

      const hour = new Date(order.createdAt).getHours();
      if (hourlyMap[hour]) { hourlyMap[hour].revenue += order.totalAmount; hourlyMap[hour].orders++; }

      if (order.employeeId && order.employee) {
        if (!employeeMap[order.employeeId]) employeeMap[order.employeeId] = { name: order.employee.name, sales: 0, transactions: 0 };
        employeeMap[order.employeeId].sales += order.totalAmount;
        employeeMap[order.employeeId].transactions++;
      }
    }

    for (const v of voided) { totalRefund += v.totalAmount; }

    const netSales = totalRevenue - totalRefund;
    const grossProfit = totalRevenue - totalCost;
    const cashTotal = paymentMap['CASH']?.amount || 0;
    const expectedCash = (openDrawer?.openingAmount || 0) + cashTotal;

    return NextResponse.json({
      date: today.toISOString().split('T')[0],
      totalOrders: orders.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      totalRefund: Math.round(totalRefund * 100) / 100,
      netSales: Math.round(netSales * 100) / 100,
      cashTotal: Math.round(cashTotal * 100) / 100,
      nonCashTotal: Math.round((netSales - cashTotal) * 100) / 100,
      openingAmount: openDrawer?.openingAmount || 0,
      expectedCash: Math.round(expectedCash * 100) / 100,
      drawerId: openDrawer?.id || null,
      paymentBreakdown: Object.entries(paymentMap).map(([method, data]) => ({ method: method.replace(/_/g, ' '), ...data, amount: Math.round(data.amount * 100) / 100 })),
      hourlyBreakdown: Object.entries(hourlyMap).filter(([, d]) => d.orders > 0).map(([hour, data]) => ({ hour: `${hour}:00`, ...data, revenue: Math.round(data.revenue * 100) / 100 })),
      employeeBreakdown: Object.values(employeeMap).map(e => ({ ...e, sales: Math.round(e.sales * 100) / 100 })),
      voidedOrders: voided.map(v => ({ ...v, createdAt: v.createdAt.toISOString() })),
    });
  } catch (error) {
    console.error('Closing GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch closing data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, openingAmount, closingAmount, employeeId, notes } = body;

    if (action === 'OPEN') {
      const existing = await db.cashDrawer.findFirst({ where: { status: 'OPEN' } });
      if (existing) return NextResponse.json({ error: 'A drawer is already open' }, { status: 400 });
      const drawer = await db.cashDrawer.create({ data: { employeeId: employeeId || null, openingAmount: openingAmount || 0, notes } });
      return NextResponse.json({ ...drawer, openedAt: drawer.openedAt.toISOString(), closedAt: drawer.closedAt?.toISOString() || null });
    }

    if (action === 'CLOSE') {
      const openDrawer = await db.cashDrawer.findFirst({ where: { status: 'OPEN' }, orderBy: { openedAt: 'desc' } });
      if (!openDrawer) return NextResponse.json({ error: 'No open drawer found' }, { status: 400 });
      const closed = await db.cashDrawer.update({ where: { id: openDrawer.id }, data: { closingAmount: closingAmount || 0, status: 'CLOSED', closedAt: new Date(), notes: notes || null } });
      return NextResponse.json({ ...closed, openedAt: closed.openedAt.toISOString(), closedAt: closed.closedAt?.toISOString() || null });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Closing POST error:', error);
    return NextResponse.json({ error: 'Failed to process closing' }, { status: 500 });
  }
}
