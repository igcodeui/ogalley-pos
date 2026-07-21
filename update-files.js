const fs = require('fs');
const path = require('path');

// 1. Create store API
fs.mkdirSync('src/app/api/store', { recursive: true });
fs.writeFileSync('src/app/api/store/route.ts', `import { NextRequest, NextResponse } from 'next/server';
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
    return NextResponse.json({ error: 'Failed to fetch store settings' }, { status: 500 });
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
    return NextResponse.json({ error: 'Failed to update store settings' }, { status: 500 });
  }
}
`);
console.log('Created: src/app/api/store/route.ts');

// 2. Read EmployeesView and make 3 targeted replacements
let emp = fs.readFileSync('src/components/employees/EmployeesView.tsx', 'utf8');

// Add SalesEntry interface before export default
emp = emp.replace(
  "export default function EmployeesView() {",
  \`interface SalesEntry { employeeId: string; totalSales: number; }

export default function EmployeesView() {\`
);

// Add salesMap state
emp = emp.replace(
  "const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});",
  "const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});\\n  const [salesMap, setSalesMap] = useState<Record<string, number>>({});"
);

// Update fetchData to also fetch dashboard
emp = emp.replace(
  "const [empRes, attRes] = await Promise.all([\\n        fetch('/api/employees').then(r => r.json()),\\n        fetch('/api/attendance').then(r => r.json()).catch(() => []),\\n      ]);",
  \`const [empRes, attRes, dashRes] = await Promise.all([
        fetch('/api/employees').then(r => r.json()),
        fetch('/api/attendance').then(r => r.json()).catch(() => []),
        fetch('/api/dashboard').then(r => r.json()).catch(() => ({ employeeRanking: [] })),
      ]);\`
);

// Add salesMap population after setAttendance
emp = emp.replace(
  "setAttendance(map);\\n    } catch",
  \`setAttendance(map);
      const sm: Record<string, number> = {};
      for (const e of (dashRes?.employeeRanking || []) as SalesEntry[]) {
        sm[e.employeeId] = e.totalSales;
      }
      setSalesMap(sm);
    } catch\`
);

// Replace fake sales with real
emp = emp.replace(
  "const fakeSales = [12450, 9800, 8200][i] || 5000;\\n            const maxSales = 15000;\\n            const pct = Math.min(100, (fakeSales / maxSales) * 100);",
  \`const realSales = salesMap[emp.id] || 0;
            const allSales = employees.filter(e => e.role === 'CASHIER' || e.role === 'MANAGER').map(e => salesMap[e.id] || 0);
            const maxSales = Math.max(...allSales, 1);
            const pct = Math.min(100, (realSales / maxSales) * 100);\`
);

emp = emp.replace(
  "{formatCurrency(fakeSales)}",
  "{formatCurrency(realSales)}"
);

// Add empty state after the closing div of the map
emp = emp.replace(
  "        </div>\\n      </div>\\n\\n      {/\u0032\u0032 Add/Edit Employee Modal",
  \`</div>
          {Object.keys(salesMap).length === 0 && (
            <p className="text-xs text-[#555] text-center py-4">No sales recorded today yet. Start processing orders on the POS to see performance here.</p>
          )}
        </div>
      </div>

      {/* Add/Edit Employee Modal\`
);

fs.writeFileSync('src/components/employees/EmployeesView.tsx', emp);
console.log('Updated: src/components/employees/EmployeesView.tsx');

console.log('\\nDone! Now run: git add . && git commit -m "editable settings + real sales" && git push');