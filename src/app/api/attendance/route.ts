import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch attendance records (supports ?from=&to=&export=csv)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const exportCsv = searchParams.get('export') === 'csv';

    let dateFilter: any = {};
    if (from || to) {
      dateFilter.clockIn = {};
      if (from) dateFilter.clockIn.gte = new Date(from + 'T00:00:00');
      if (to) {
        const toDate = new Date(to + 'T00:00:00');
        toDate.setDate(toDate.getDate() + 1);
        dateFilter.clockIn.lt = toDate;
      }
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateFilter = { clockIn: { gte: today, lt: tomorrow } };
    }

    const records = await db.attendance.findMany({
      where: dateFilter,
      include: { employee: { select: { id: true, name: true, role: true, hourlyRate: true, commissionRate: true } } },
      orderBy: { clockIn: 'desc' },
    });

    if (exportCsv) {
      const header = 'Date,Employee,Role,Clock In,Clock Out,Hours Worked,Daily Rate,Commission Rate,Status';
      const rows = records.map(r => {
        const date = new Date(r.clockIn).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const clockIn = new Date(r.clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const clockOut = r.clockOut ? new Date(r.clockOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
        const hours = r.hoursWorked != null ? r.hoursWorked.toFixed(2) : '';
        const rate = r.employee.hourlyRate ?? 0;
        const commission = r.employee.commissionRate ?? 0;
        return `${date},"${r.employee.name}",${r.employee.role},${clockIn},${clockOut},${hours},${rate},${(commission * 100).toFixed(1)}%,${r.status}`;
      });
      const csv = [header, ...rows].join('\n');
      const filename = from && to ? `attendance-${from}-to-${to}.csv` : 'attendance-today.csv';
      return new NextResponse(csv, {
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${filename}"` },
      });
    }

    return NextResponse.json(records.map(r => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employee.name,
      employeeRole: r.employee.role,
      dailyRate: r.employee.hourlyRate ?? 0,
      commissionRate: r.employee.commissionRate ?? 0,
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
    const { employeeId, action } = body;

    if (!employeeId || !action) {
      return NextResponse.json({ error: 'Employee ID and action required' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (action === 'IN') {
      const existing = await db.attendance.findFirst({
        where: { employeeId, clockIn: { gte: today, lt: tomorrow }, clockOut: null },
      });

      if (existing) {
        return NextResponse.json({ error: 'Already clocked in', attendance: existing }, { status: 409 });
      }

      const record = await db.attendance.create({
        data: { employeeId, clockIn: new Date(), status: 'ACTIVE' },
        include: { employee: { select: { name: true } } },
      });

      return NextResponse.json({
        id: record.id, employeeId: record.employeeId, employeeName: record.employee.name,
        clockIn: record.clockIn.toISOString(), clockOut: null, status: record.status,
      }, { status: 201 });

    } else if (action === 'OUT') {
      const record = await db.attendance.findFirst({
        where: { employeeId, clockIn: { gte: today, lt: tomorrow }, clockOut: null },
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
        data: { clockOut, hoursWorked, status: 'COMPLETED' },
        include: { employee: { select: { name: true } } },
      });

      return NextResponse.json({
        id: updated.id, employeeId: updated.employeeId, employeeName: updated.employee.name,
        clockIn: updated.clockIn.toISOString(), clockOut: updated.clockOut!.toISOString(),
        hoursWorked: updated.hoursWorked, status: updated.status,
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use IN or OUT' }, { status: 400 });
  } catch (error) {
    console.error('Error processing attendance:', error);
    return NextResponse.json({ error: 'Failed to process attendance' }, { status: 500 });
  }
}
