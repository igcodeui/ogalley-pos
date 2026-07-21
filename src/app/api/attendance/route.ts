import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch today's attendance records
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const records = await db.attendance.findMany({
      where: { clockIn: { gte: today, lt: tomorrow } },
      include: { employee: { select: { id: true, name: true, role: true } } },
      orderBy: { clockIn: 'desc' },
    });

    return NextResponse.json(records.map(r => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employee.name,
      employeeRole: r.employee.role,
      clockIn: r.clockIn.toISOString(),
      clockOut: r.clockOut?.toISOString() ?? null,
      hoursWorked: r.hoursWorked ?? null,
      status: r.status,
    })));
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

// POST - Clock in or clock out
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, action } = body; // action: 'IN' or 'OUT'

    if (!employeeId || !action) {
      return NextResponse.json({ error: 'Employee ID and action required' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (action === 'IN') {
      // Check if already clocked in today without clock out
      const existing = await db.attendance.findFirst({
        where: {
          employeeId,
          clockIn: { gte: today, lt: tomorrow },
          clockOut: null,
        },
      });

      if (existing) {
        return NextResponse.json({ error: 'Already clocked in', attendance: existing }, { status: 409 });
      }

      const record = await db.attendance.create({
        data: {
          id: `att-${Date.now()}`,
          employeeId,
          clockIn: new Date(),
          status: 'ACTIVE',
        },
        include: { employee: { select: { name: true } } },
      });

      return NextResponse.json({
        id: record.id,
        employeeId: record.employeeId,
        employeeName: record.employee.name,
        clockIn: record.clockIn.toISOString(),
        clockOut: null,
        status: record.status,
      }, { status: 201 });

    } else if (action === 'OUT') {
      const record = await db.attendance.findFirst({
        where: {
          employeeId,
          clockIn: { gte: today, lt: tomorrow },
          clockOut: null,
        },
        orderBy: { clockIn: 'desc' },
      });

      if (!record) {
        return NextResponse.json({ error: 'No active clock-in found' }, { status: 404 });
      }

      const clockOut = new Date();
      const diffMs = clockOut.getTime() - record.clockIn.getTime();
      const hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

      const updated = await db.attendance.update({
        where: { id: record.id },
        data: {
          clockOut,
          hoursWorked,
          status: 'COMPLETED',
        },
        include: { employee: { select: { name: true } } },
      });

      return NextResponse.json({
        id: updated.id,
        employeeId: updated.employeeId,
        employeeName: updated.employee.name,
        clockIn: updated.clockIn.toISOString(),
        clockOut: updated.clockOut!.toISOString(),
        hoursWorked: updated.hoursWorked,
        status: updated.status,
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use IN or OUT' }, { status: 400 });
  } catch (error) {
    console.error('Error processing attendance:', error);
    return NextResponse.json({ error: 'Failed to process attendance' }, { status: 500 });
  }
}