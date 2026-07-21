import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const customers = await db.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { phone: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });

    const serialized = customers.map((c) => ({
      ...c,
      birthday: c.birthday?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

// POST - Create customer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, birthday, address } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    const customer = await db.customer.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        birthday: birthday ? new Date(birthday) : null,
        address: address?.trim() || null,
        loyaltyPoints: 0,
        cashbackBalance: 0,
        membershipLevel: 'BRONZE',
        totalSpent: 0,
        totalVisits: 0,
        referralCode: `OG-${Date.now().toString(36).toUpperCase()}`,
      },
    });

    return NextResponse.json({
      ...customer,
      birthday: customer.birthday?.toISOString() ?? null,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}