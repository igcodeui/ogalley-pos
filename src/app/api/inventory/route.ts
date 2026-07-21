import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const inventoryItems = await db.inventoryItem.findMany({
      include: { product: true },
      orderBy: { updatedAt: 'desc' },
    });

    const serialized = inventoryItems.map((item) => ({
      ...item,
      product: item.product
        ? { ...item.product, createdAt: item.product.createdAt.toISOString(), updatedAt: item.product.updatedAt.toISOString() }
        : null,
      expiryDate: item.expiryDate?.toISOString() ?? null,
      lastRestocked: item.lastRestocked?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

// PUT - Adjust stock (set currentStock, update lastRestocked)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, currentStock, minStock, maxStock, unit, costPrice, batchNumber, expiryDate } = body;

    if (!id) {
      return NextResponse.json({ error: 'Inventory item ID is required' }, { status: 400 });
    }

    const existing = await db.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    const updated = await db.inventoryItem.update({
      where: { id },
      data: {
        currentStock: currentStock !== undefined ? currentStock : existing.currentStock,
        minStock: minStock !== undefined ? minStock : existing.minStock,
        maxStock: maxStock !== undefined ? (maxStock ?? null) : existing.maxStock,
        unit: unit ?? existing.unit,
        costPrice: costPrice !== undefined ? costPrice : existing.costPrice,
        batchNumber: batchNumber !== undefined ? (batchNumber ?? null) : existing.batchNumber,
        expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : existing.expiryDate,
        lastRestocked: new Date(),
      },
    });

    return NextResponse.json({
      ...updated,
      expiryDate: updated.expiryDate?.toISOString() ?? null,
      lastRestocked: updated.lastRestocked?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}

// POST - Create inventory item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, currentStock, minStock, maxStock, unit, costPrice, batchNumber, expiryDate } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const item = await db.inventoryItem.create({
      data: {
        productId,
        currentStock: currentStock ?? 0,
        minStock: minStock ?? 5,
        maxStock: maxStock ?? null,
        unit: unit ?? 'pcs',
        costPrice: costPrice ?? 0,
        batchNumber: batchNumber ?? null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        lastRestocked: new Date(),
      },
    });

    return NextResponse.json({
      ...item,
      expiryDate: item.expiryDate?.toISOString() ?? null,
      lastRestocked: item.lastRestocked?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}