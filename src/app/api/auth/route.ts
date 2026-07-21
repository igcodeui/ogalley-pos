import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEFAULT_ADMIN_PIN = '1234';
const DEFAULT_ADMIN_EMAIL = 'admin@ogalley.com';

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    if (!pin || pin.length < 4) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
    }

    // First-run bootstrap: if no employees exist, auto-create a default admin
    const employeeCount = await db.employee.count();
    if (employeeCount === 0) {
      await db.employee.create({
        data: {
          name: 'Admin',
          email: DEFAULT_ADMIN_EMAIL,
          role: 'OWNER',
          pin: DEFAULT_ADMIN_PIN,
          isActive: true,
          hireDate: new Date(),
          hourlyRate: 0,
          commissionRate: 0,
        },
      });
    }

    const employee = await db.employee.findFirst({
      where: { pin, isActive: true },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Invalid PIN or employee not active' }, { status: 401 });
    }

    return NextResponse.json({
      id: employee.id,
      name: employee.name,
      email: employee.email || '',
      phone: employee.phone || '',
      role: employee.role,
      pin: employee.pin,
      isActive: employee.isActive,
      hireDate: employee.hireDate?.toISOString() ?? null,
      hourlyRate: employee.hourlyRate,
      commissionRate: employee.commissionRate,
      createdAt: employee.createdAt.toISOString(),
      updatedAt: employee.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}