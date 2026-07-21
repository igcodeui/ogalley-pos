import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const products = await db.product.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { sku: { contains: search } },
              { barcode: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { sortOrder: 'asc' },
    });

    const serialized = products.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check for duplicate SKU
    const existingSku = await db.product.findFirst({ where: { sku: body.sku } });
    if (existingSku) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 409 });
    }

    const product = await db.product.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        sku: body.sku,
        barcode: body.barcode ?? null,
        imageUrl: body.imageUrl ?? null,
        costPrice: body.costPrice ?? 0,
        sellingPrice: body.sellingPrice,
        isAvailable: body.isAvailable ?? true,
        isFavorite: body.isFavorite ?? false,
        categoryIds: body.categoryIds ?? '[]',
        variants: body.variants ?? null,
        addons: body.addons ?? null,
        recipe: body.recipe ?? null,
        sizeOptions: body.sizeOptions ?? null,
        hasSugarLevel: body.hasSugarLevel ?? false,
        hasIceLevel: body.hasIceLevel ?? false,
        hasHotCold: body.hasHotCold ?? false,
        sortOrder: body.sortOrder ?? 0,
      },
    });

    return NextResponse.json(
      { ...product, createdAt: product.createdAt.toISOString(), updatedAt: product.updatedAt.toISOString() },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

// PUT - Update existing product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check for duplicate SKU (excluding current product)
    if (data.sku && data.sku !== existing.sku) {
      const dup = await db.product.findFirst({ where: { sku: data.sku, id: { not: id } } });
      if (dup) {
        return NextResponse.json({ error: 'SKU already exists' }, { status: 409 });
      }
    }

    const product = await db.product.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        description: data.description !== undefined ? (data.description ?? null) : existing.description,
        sku: data.sku ?? existing.sku,
        barcode: data.barcode !== undefined ? (data.barcode ?? null) : existing.barcode,
        imageUrl: data.imageUrl !== undefined ? (data.imageUrl ?? null) : existing.imageUrl,
        costPrice: data.costPrice !== undefined ? data.costPrice : existing.costPrice,
        sellingPrice: data.sellingPrice ?? existing.sellingPrice,
        isAvailable: data.isAvailable !== undefined ? data.isAvailable : existing.isAvailable,
        isFavorite: data.isFavorite !== undefined ? data.isFavorite : existing.isFavorite,
        categoryIds: data.categoryIds !== undefined ? data.categoryIds : existing.categoryIds,
        variants: data.variants !== undefined ? (data.variants ?? null) : existing.variants,
        addons: data.addons !== undefined ? (data.addons ?? null) : existing.addons,
        recipe: data.recipe !== undefined ? (data.recipe ?? null) : existing.recipe,
        sizeOptions: data.sizeOptions !== undefined ? (data.sizeOptions ?? null) : existing.sizeOptions,
        hasSugarLevel: data.hasSugarLevel !== undefined ? data.hasSugarLevel : existing.hasSugarLevel,
        hasIceLevel: data.hasIceLevel !== undefined ? data.hasIceLevel : existing.hasIceLevel,
        hasHotCold: data.hasHotCold !== undefined ? data.hasHotCold : existing.hasHotCold,
        sortOrder: data.sortOrder !== undefined ? data.sortOrder : existing.sortOrder,
      },
    });

    return NextResponse.json({
      ...product,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE - Soft delete (deactivate) product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    await db.product.update({
      where: { id },
      data: { isAvailable: false },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deactivating product:', error);
    const code = (error as { code?: string }).code;
    if (code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to deactivate product' }, { status: 500 });
  }
}