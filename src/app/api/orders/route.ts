import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: Record<string, unknown> = {};
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    const orders = await db.order.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        customer: true,
        employee: { select: { id: true, name: true, role: true } },
        items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
        payments: true,
        refunds: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const serialized = orders.map((o) => ({
      ...o,
      customer: o.customer
        ? { ...o.customer, birthday: o.customer.birthday?.toISOString() ?? null, createdAt: o.customer.createdAt.toISOString(), updatedAt: o.customer.updatedAt.toISOString() }
        : null,
      employee: o.employee,
      items: o.items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), product: item.product ?? null })),
      payments: o.payments.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
      refunds: o.refunds.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Deduct inventory for each item
    const items = body.items ?? [];
    for (const item of items) {
      if (item.productId) {
        await db.inventoryItem.updateMany({
          where: { productId: item.productId, currentStock: { gt: 0 } },
          data: { currentStock: { decrement: item.quantity || 1 } },
        }).catch(() => {
          // No inventory record for this product — skip silently
        });
      }
    }

    const order = await db.order.create({
      data: {
        orderNumber: body.orderNumber,
        customerId: body.customerId ?? null,
        employeeId: body.employeeId ?? null,
        orderType: body.orderType ?? 'DINE_IN',
        status: body.status ?? 'COMPLETED',
        subtotal: body.subtotal ?? 0,
        discountAmount: body.discountAmount ?? 0,
        discountType: body.discountType ?? null,
        discountCode: body.discountCode ?? null,
        taxAmount: body.taxAmount ?? 0,
        taxExempt: body.taxExempt ?? false,
        totalAmount: body.totalAmount ?? 0,
        amountPaid: body.amountPaid ?? 0,
        changeAmount: body.changeAmount ?? 0,
        paymentMethod: body.paymentMethod ?? 'CASH',
        paymentNote: body.paymentNote ?? null,
        referenceNumber: body.referenceNumber ?? null,
        notes: body.notes ?? null,
        isSplit: body.isSplit ?? false,
        splitFromOrderId: body.splitFromOrderId ?? null,
        loyaltyPointsEarned: body.loyaltyPointsEarned ?? 0,
        receiptPrinted: body.receiptPrinted ?? false,
        items: {
          create: items.map((item: {
            productId: string; productName: string; quantity: number; unitPrice: number; subtotal: number;
            variant?: string | null; size?: string | null; sugarLevel?: string | null;
            iceLevel?: string | null; temperature?: string | null; addons?: string | null;
            notes?: string | null; costPrice?: number; profit?: number;
          }) => ({
            productId: item.productId, productName: item.productName, quantity: item.quantity,
            unitPrice: item.unitPrice, subtotal: item.subtotal, variant: item.variant ?? null,
            size: item.size ?? null, sugarLevel: item.sugarLevel ?? null, iceLevel: item.iceLevel ?? null,
            temperature: item.temperature ?? null, addons: item.addons ?? null, notes: item.notes ?? null,
            costPrice: item.costPrice ?? 0, profit: item.profit ?? 0,
          })),
        },
        payments: {
          create: (body.payments ?? []).map((payment: { method: string; amount: number; referenceNumber?: string | null; notes?: string | null }) => ({
            method: payment.method, amount: payment.amount, referenceNumber: payment.referenceNumber ?? null, notes: payment.notes ?? null,
          })),
        },
      },
      include: { customer: true, employee: { select: { id: true, name: true, role: true } }, items: { include: { product: true } }, payments: true },
    });

    // Update customer stats if a customer is attached
    if (body.customerId) {
      const points = body.loyaltyPointsEarned ?? Math.floor(body.totalAmount / 100);
      await db.customer.update({
        where: { id: body.customerId },
        data: {
          totalSpent: { increment: body.totalAmount ?? 0 },
          totalVisits: { increment: 1 },
          loyaltyPoints: { increment: points },
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      ...order, createdAt: order.createdAt.toISOString(), updatedAt: order.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

// PUT - Void or refund an order
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, reason } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Order ID and action are required' }, { status: 400 });
    }

    const order = await db.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (action === 'VOID') {
      // Restore inventory
      for (const item of order.items) {
        await db.inventoryItem.updateMany({
          where: { productId: item.productId },
          data: { currentStock: { increment: item.quantity } },
        }).catch(() => {});
      }
      await db.order.update({ where: { id }, data: { status: 'VOID', notes: (order.notes ? order.notes + ' | ' : '') + 'VOIDED: ' + (reason || 'No reason provided') } });
    } else if (action === 'REFUND') {
      await db.order.update({ where: { id }, data: { status: 'REFUND', notes: (order.notes ? order.notes + ' | ' : '') + 'REFUNDED: ' + (reason || 'No reason provided') } });
    } else {
      return NextResponse.json({ error: 'Invalid action. Use VOID or REFUND.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}