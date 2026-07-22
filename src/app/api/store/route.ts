import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let store = await db.store.findFirst();
    if (!store) {
      store = await db.store.create({
        data: { name: "O'Galley", address: '', phone: '', email: '', taxRate: 0.12, currency: 'PHP', footerMessage: 'Thank you for visiting!' },
      });
    }
    return NextResponse.json(store);
  } catch (error) {
    console.error('Store GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    let store = await db.store.findFirst();
    if (!store) {
      store = await db.store.create({ data: body });
    } else {
      const updates: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(body)) {
        if (v !== undefined) updates[k] = v;
      }
      store = await db.store.update({ where: { id: store.id }, data: updates });
    }
    return NextResponse.json(store);
  } catch (error) {
    console.error('Store PUT error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}