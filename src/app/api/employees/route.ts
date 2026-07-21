import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all employees
export async function GET() {
  try {
    const employees = await db.employee.findMany({ orderBy: { createdAt: 'desc' } });
    const serialized = employees.map((e) => ({
      id: e.id,
      name: e.name,
      email: e.email,
      phone: e.phone,
      role: e.role,
      isActive: e.isActive,
      hireDate: e.hireDate?.toISOString() ?? null,
      hourlyRate: e.hourlyRate,
      commissionRate: e.commissionRate,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      // PIN is NOT sent to client for security
    }));
    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

// POST - Create new employee
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, role, pin, hireDate, hourlyRate, commissionRate } = body;

    if (!name || !pin) {
      return NextResponse.json({ error: 'Name and PIN are required' }, { status: 400 });
    }

    if (pin.length < 4) {
      return NextResponse.json({ error: 'PIN must be at least 4 digits' }, { status: 400 });
    }

    // Check duplicate email
    if (email) {
      const existing = await db.employee.findFirst({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
      }
    }

    const employee = await db.employee.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        role: role || 'CASHIER',
        pin,
        isActive: true,
        hireDate: hireDate ? new Date(hireDate) : null,
        hourlyRate: hourlyRate || 0,
        commissionRate: commissionRate || 0,
      },
    });

    return NextResponse.json({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      isActive: employee.isActive,
      hireDate: employee.hireDate?.toISOString() ?? null,
      hourlyRate: employee.hourlyRate,
      commissionRate: employee.commissionRate,
      createdAt: employee.createdAt.toISOString(),
      updatedAt: employee.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}

// PUT - Update existing employee
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, email, phone, role, pin, hireDate, hourlyRate, commissionRate, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const existing = await db.employee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check duplicate email (excluding current employee)
    if (email && email !== existing.email) {
      const duplicate = await db.employee.findFirst({ where: { email, id: { not: id } } });
      if (duplicate) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
      }
    }

    const employee = await db.employee.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        email: email ?? existing.email,
        phone: phone !== undefined ? (phone || null) : existing.phone,
        role: role ?? existing.role,
        pin: pin ?? existing.pin,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        hireDate: hireDate !== undefined ? (hireDate ? new Date(hireDate) : null) : existing.hireDate,
        hourlyRate: hourlyRate !== undefined ? hourlyRate : existing.hourlyRate,
        commissionRate: commissionRate !== undefined ? commissionRate : existing.commissionRate,
      },
    });

    return NextResponse.json({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      isActive: employee.isActive,
      hireDate: employee.hireDate?.toISOString() ?? null,
      hourlyRate: employee.hourlyRate,
      commissionRate: employee.commissionRate,
      createdAt: employee.createdAt.toISOString(),
      updatedAt: employee.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

// DELETE - Remove employee
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });

    await db.attendance.deleteMany({ where: { employeeId: id } });
    await db.employee.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting employee:', error);
    const code = (error as { code?: string }).code;
    if (code === 'P2025') {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}