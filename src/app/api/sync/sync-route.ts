import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const orders = await req.json();
    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ error: 'Expected non-empty array of orders' }, { status: 400 });
    }

    const results = [];

    for (const order of orders) {
      try {
        const { _queuedAt, ...data } = order;

        const created = await db.order.create({
          data: {
            orderNumber: data.orderNumber,
            customerId: data.customerId ?? null,
            employeeId: data.employeeId ?? null,
            orderType: data.orderType || 'DINE_IN',
            status: 'COMPLETED',
            subtotal: data.subtotal || 0,
            discountAmount: data.discountAmount || 0,
            discountType: data.discountType || null,
            discountCode: data.discountCode || null,
            taxExempt: data.taxExempt || false,
            taxAmount: data.taxAmount || 0,
            totalAmount: data.totalAmount || 0,
            amountPaid: data.amountPaid || 0,
            changeAmount: data.changeAmount || 0,
            paymentMethod: data.paymentMethod || 'CASH',
            items: {
              create: (data.items || []).map((item: any) => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
                variant: item.variant ?? null,
                size: item.size ?? null,
                sugarLevel: item.sugarLevel ?? null,
                iceLevel: item.iceLevel ?? null,
                temperature: item.temperature ?? null,
                addons: item.addons ?? null,
                notes: item.notes ?? null,
                costPrice: item.costPrice || 0,
                profit: item.profit || 0,
              })),
            },
            payments: {
              create: (data.payments || []).map((p: any) => ({
                method: p.method,
                amount: p.amount,
                referenceNumber: p.referenceNumber ?? null,
                notes: p.notes ?? null,
              })),
            },
          },
        });

        if (data.customerId) {
          try {
            await db.customer.update({
              where: { id: data.customerId },
              data: {
                totalSpent: { increment: data.totalAmount || 0 },
                totalVisits: { increment: 1 },
                loyaltyPoints: { increment: Math.floor((data.totalAmount || 0) * 0.01) },
              },
            });
          } catch { /* customer may not exist */ }
        }

        results.push({ success: true, id: created.id, orderNumber: data.orderNumber });
      } catch (e) {
        results.push({ success: false, orderNumber: order.orderNumber, error: String(e) });
      }
    }

    const synced = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({ results, synced, failed });
  } catch (error) {
    console.error('Sync failed:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
