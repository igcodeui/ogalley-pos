import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const categories = await db.category.findMany({ orderBy: { sortOrder: 'asc' } });
    const serialized = categories.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, icon, color, sortOrder } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const category = await db.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || null,
        color: color || null,
        sortOrder: sortOrder ?? 0,
        isActive: true,
      },
    });

    return NextResponse.json({
      ...category,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });

    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    const updated = await db.category.update({
      where: { id },
      data: {
        name: data.name?.trim() ?? existing.name,
        description: data.description !== undefined ? (data.description?.trim() ?? null) : existing.description,
        icon: data.icon !== undefined ? (data.icon ?? null) : existing.icon,
        color: data.color !== undefined ? (data.color ?? null) : existing.color,
        sortOrder: data.sortOrder !== undefined ? data.sortOrder : existing.sortOrder,
        isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      },
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Category ID required' }, { status: 400 });

    await db.category.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deactivating category:', error);
    const code = (error as { code?: string }).code;
    if (code === 'P2025') return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to deactivate category' }, { status: 500 });
  }
}