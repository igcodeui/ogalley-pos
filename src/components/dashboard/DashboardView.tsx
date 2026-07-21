'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  ShoppingBag,
  Receipt,
  ArrowUpRight,
  AlertTriangle,
  Trophy,
  PackageX,
} from 'lucide-react';
import type { DashboardStats } from '@/lib/types';
import { formatCurrency } from '@/lib/constants';

/* ─── Animation Variants ─────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ─── Chart Colors ───────────────────────────────────────────────── */
const BRONZE = '#C48A3A';
const BRONZE_LIGHT = '#D4A050';
const GREEN = '#6B8E6B';
const AXIS_COLOR = '#888888';
const GRID_COLOR = 'rgba(255,255,255,0.06)';

const PIE_COLORS = ['#C48A3A', '#6B8E6B', '#6B8BAE', '#8B6B8E', '#AE8B6B', '#8BAE8B', '#AE6B8B', '#6BAEAE'];

/* ─── Custom Tooltip ─────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string; color?: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#1E1E1E] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      {label && <p className="text-xs text-[#888] mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color || BRONZE }}>
          {entry.name ? `${entry.name}: ` : ''}{formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

/* ─── Pie Tooltip (shows percentage) ─────────────────────────────── */
function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percentage?: number; fill: string } }> }) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-[#1E1E1E] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-sm font-medium" style={{ color: entry.payload.fill || BRONZE }}>
        {entry.name}: {entry.percentage != null ? `${entry.percentage}%` : formatCurrency(entry.value)}
      </p>
    </div>
  );
}

/* ─── Pie Label ──────────────────────────────────────────────────── */
const renderPieLabel = ({ name, percentage }: { name: string; percentage?: number }) => {
  if (percentage == null || percentage < 5) return null;
  return (
    <text
      x={0}
      y={0}
      textAnchor="middle"
      dominantBaseline="central"
      fill="#fff"
      fontSize={11}
      fontWeight={600}
    >
      {percentage}%
    </text>
  );
};

/* ─── KPI Card ───────────────────────────────────────────────────── */
interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  gradientClass: string;
  glowClass?: string;
}

function KpiCard({ icon, label, value, change, gradientClass, glowClass }: KpiCardProps) {
  return (
    <motion.div variants={itemVariants} className={`${glowClass ?? ''}`}>
      <div className={`premium-card ${gradientClass} p-4 lg:p-5 relative overflow-hidden`}>
        {/* Decorative background orb */}
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/[0.03] blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-white/[0.06]">{icon}</div>
          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
            <ArrowUpRight className="w-3 h-3" />
            {change}
          </span>
        </div>
        <p className="text-xs uppercase tracking-wider text-[#888] mb-1">{label}</p>
        <p className="text-2xl lg:text-3xl font-bold text-white leading-tight">{value}</p>
      </div>
    </motion.div>
  );
}

/* ─── Section Title ──────────────────────────────────────────────── */
function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-sm font-semibold uppercase tracking-wider text-[#888] mb-3 ${className ?? ''}`}>
      {children}
    </h3>
  );
}

/* ─── Loading Skeleton ───────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* KPI skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-shimmer h-28 rounded-2xl bg-[#1A1A1A]"
          />
        ))}
      </div>
      {/* Chart skeleton row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 animate-shimmer h-[340px] rounded-2xl bg-[#1A1A1A]" />
        <div className="animate-shimmer h-[340px] rounded-2xl bg-[#1A1A1A]" />
      </div>
      {/* Chart skeleton row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 animate-shimmer h-[340px] rounded-2xl bg-[#1A1A1A]" />
        <div className="animate-shimmer h-[340px] rounded-2xl bg-[#1A1A1A]" />
      </div>
      {/* Table skeleton */}
      <div className="animate-shimmer h-[280px] rounded-2xl bg-[#1A1A1A]" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN DASHBOARD VIEW
   ═══════════════════════════════════════════════════════════════════ */
export default function DashboardView() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        if (!cancelled) {
          // Map API response → DashboardStats shape (graceful fallbacks)
          const mapped: DashboardStats = {
            todaySales: json.todaySales ?? 0,
            weeklySales: json.weeklySales ?? 0,
            monthlySales: json.monthlySales ?? 0,
            annualSales: json.annualSales ?? 0,
            todayTransactions: json.todayTransactions ?? 0,
            todayCustomers: json.todayCustomers ?? 0,
            avgOrderValue: json.avgOrderValue ?? 0,
            grossProfit: json.grossProfit ?? 0,
            netProfit: json.netProfit ?? 0,
            refundTotal: json.refundTotal ?? 0,
            cancelledTotal: json.cancelledTotal ?? 0,
            hourlySales: (json.hourlySales ?? []).map((h: Record<string, unknown>) => ({
              hour: String(h.hour ?? ''),
              sales: Number(h.sales ?? 0),
              orders: Number(h.orders ?? 0),
            })),
            dailySales: (json.dailySales ?? []).map((d: Record<string, unknown>) => ({
              date: String(d.date ?? ''),
              sales: Number(d.sales ?? 0),
              orders: Number(d.orders ?? 0),
            })),
            bestSellers: (json.bestSellers ?? []).map((b: Record<string, unknown>) => ({
              productName: String(b.productName ?? ''),
              quantity: Number(b.quantity ?? b.totalQty ?? 0),
              revenue: Number(b.revenue ?? b.totalRevenue ?? 0),
            })),
            slowMovers: (json.slowMovers ?? []).map((s: Record<string, unknown>) => ({
              productName: String(s.productName ?? ''),
              quantity: Number(s.quantity ?? s.totalQty ?? 0),
              revenue: Number(s.revenue ?? 0),
            })),
            categoryPerformance: (json.categoryPerformance ?? []).map((c: Record<string, unknown>) => ({
              category: String(c.category ?? c.categoryName ?? ''),
              sales: Number(c.sales ?? 0),
              percentage: Number(c.percentage ?? 0),
            })),
            lowStockItems: (json.lowStockItems ?? []).map((l: Record<string, unknown>) => ({
              productName:
                String((l.product as Record<string, unknown>)?.name ?? l.productName ?? 'Unknown'),
              currentStock: Number(l.currentStock ?? 0),
              minStock: Number(l.minStock ?? 0),
            })),
            employeeRanking: (json.employeeRanking ?? []).map((e: Record<string, unknown>) => ({
              name: String(e.name ?? e.employeeName ?? 'Unknown'),
              sales: Number(e.sales ?? e.totalSales ?? 0),
              transactions: Number(e.transactions ?? e.orderCount ?? 0),
            })),
          };
          setData(mapped);
        }
      } catch (err) {
        console.error('Dashboard fetch error', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ─── Loading State ─────────────────────────────────────────────── */
  if (loading) return <LoadingSkeleton />;

  /* ─── Null guard ────────────────────────────────────────────────── */
  if (!data) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[50vh]">
        <p className="text-[#888] text-sm">Unable to load dashboard data.</p>
      </div>
    );
  }

  /* ─── Derived Data ──────────────────────────────────────────────── */
  const totalCategorySales = data.categoryPerformance.reduce((s, c) => s + c.sales, 0) || 1;
  const pieData = data.categoryPerformance.map((c) => ({
    name: c.category,
    value: c.sales,
    percentage: Math.round((c.sales / totalCategorySales) * 100),
  }));

  // Compute avg order value per employee for the table
  const employeeRows = data.employeeRanking.map((e) => ({
    ...e,
    avgOrder: e.transactions > 0 ? e.sales / e.transactions : 0,
  }));

  /* ═════════════════════════════════════════════════════════════════
     RENDER
     ═════════════════════════════════════════════════════════════════ */
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-4 lg:p-6 space-y-6"
    >
      {/* ────── KPI Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<TrendingUp className="w-5 h-5 text-[#C48A3A]" />}
          label="Today&apos;s Sales"
          value={formatCurrency(data.todaySales)}
          change="12.5% vs yesterday"
          gradientClass="kpi-revenue"
          glowClass="bronze-glow"
        />
        <KpiCard
          icon={<ShoppingBag className="w-5 h-5 text-[#6B8BAE]" />}
          label="Transactions"
          value={data.todayTransactions.toLocaleString()}
          change="8.3% vs yesterday"
          gradientClass="kpi-transactions"
        />
        <KpiCard
          icon={<Receipt className="w-5 h-5 text-[#6B8E6B]" />}
          label="Avg Order Value"
          value={formatCurrency(data.avgOrderValue)}
          change="3.7% vs yesterday"
          gradientClass="kpi-profit"
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5 text-[#8B6B8E]" />}
          label="Gross Profit"
          value={formatCurrency(data.grossProfit)}
          change="15.2% vs yesterday"
          gradientClass="kpi-customers"
          glowClass="bronze-glow"
        />
      </div>

      {/* ────── Row 1: Hourly Sales Bar + Category Pie ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hourly Sales Bar Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 premium-card p-4 lg:p-5">
          <SectionTitle>Hourly Sales &mdash; Today</SectionTitle>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.hourlySales} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRONZE_LIGHT} stopOpacity={1} />
                    <stop offset="100%" stopColor={BRONZE} stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                  axisLine={{ stroke: GRID_COLOR }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar
                  dataKey="sales"
                  name="Sales"
                  fill="url(#barGrad)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Performance Pie / Donut */}
        <motion.div variants={itemVariants} className="premium-card p-4 lg:p-5">
          <SectionTitle>Category Performance</SectionTitle>
          <div className="h-[300px] w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[#888] text-sm">
                No category data yet
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="mt-2 space-y-1.5 max-h-[80px] overflow-y-auto pr-1">
            {pieData.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-white/80 truncate max-w-[120px]">{p.name}</span>
                </span>
                <span className="text-[#888] ml-2">{p.percentage}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ────── Row 2: Daily Sales Area + Best Sellers & Low Stock ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Sales Area Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 premium-card p-4 lg:p-5">
          <SectionTitle>Daily Sales &mdash; Past 7 Days</SectionTitle>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.dailySales} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRONZE} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={BRONZE} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                  axisLine={{ stroke: GRID_COLOR }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Sales"
                  stroke={BRONZE}
                  strokeWidth={2}
                  fill="url(#areaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Best Sellers & Low Stock */}
        <motion.div variants={itemVariants} className="premium-card p-4 lg:p-5 flex flex-col">
          {/* Best Sellers */}
          <SectionTitle>Top 5 Best Sellers</SectionTitle>
          <div className="space-y-2 mb-5">
            {data.bestSellers.length > 0 ? (
              data.bestSellers.map((item, idx) => (
                <div
                  key={idx}
                  className="glass-subtle rounded-xl px-3 py-2.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-[#C48A3A]/15 text-[#C48A3A] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-white truncate">{item.productName}</span>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs font-semibold text-white">{formatCurrency(item.revenue)}</p>
                    <p className="text-[10px] text-[#888]">{item.quantity} sold</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#888] py-4 text-center">No sales data yet</p>
            )}
          </div>

          {/* Low Stock Alerts */}
          <SectionTitle className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Low Stock Alerts
          </SectionTitle>
          <div className="space-y-2 flex-1 max-h-[180px] overflow-y-auto pr-1">
            {data.lowStockItems.length > 0 ? (
              data.lowStockItems.map((item, idx) => (
                <div
                  key={idx}
                  className="glass-subtle rounded-xl px-3 py-2.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PackageX className="w-4 h-4 text-red-400/70 shrink-0" />
                    <span className="text-sm text-white truncate">{item.productName}</span>
                  </div>
                  <span className="text-xs font-mono text-red-400 shrink-0 ml-2">
                    {item.currentStock} / {item.minStock}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#888] py-4 text-center">All items well-stocked</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ────── Row 3: Employee Ranking ──────────────────────────── */}
      <motion.div variants={itemVariants} className="premium-card p-4 lg:p-5">
        <SectionTitle className="flex items-center gap-1.5 mb-4">
          <Trophy className="w-4 h-4 text-[#C48A3A]" />
          Employee Performance
        </SectionTitle>

        {employeeRows.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-2.5 px-3 text-[#888] font-medium text-xs uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="text-left py-2.5 px-3 text-[#888] font-medium text-xs uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="text-right py-2.5 px-3 text-[#888] font-medium text-xs uppercase tracking-wider">
                      Total Sales
                    </th>
                    <th className="text-right py-2.5 px-3 text-[#888] font-medium text-xs uppercase tracking-wider">
                      Transactions
                    </th>
                    <th className="text-right py-2.5 px-3 text-[#888] font-medium text-xs uppercase tracking-wider">
                      Avg Order
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employeeRows.map((emp, idx) => {
                    const isTop = idx === 0;
                    return (
                      <tr
                        key={idx}
                        className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] ${
                          isTop ? 'bronze-glow' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex w-6 h-6 items-center justify-center rounded-md text-[11px] font-bold ${
                              isTop
                                ? 'bg-[#C48A3A] text-[#111111]'
                                : 'bg-white/[0.06] text-[#888]'
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`font-medium ${isTop ? 'text-white' : 'text-white/80'}`}>
                            {emp.name}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-white">
                          {formatCurrency(emp.sales)}
                        </td>
                        <td className="py-3 px-3 text-right text-[#888]">
                          {emp.transactions}
                        </td>
                        <td className="py-3 px-3 text-right text-[#888]">
                          {formatCurrency(emp.avgOrder)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {employeeRows.map((emp, idx) => {
                const isTop = idx === 0;
                return (
                  <div
                    key={idx}
                    className={`glass-subtle rounded-xl p-3.5 ${isTop ? 'bronze-glow' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex w-6 h-6 items-center justify-center rounded-md text-[11px] font-bold ${
                            isTop
                              ? 'bg-[#C48A3A] text-[#111111]'
                              : 'bg-white/[0.06] text-[#888]'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-white">{emp.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {formatCurrency(emp.sales)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#888]">
                      <span>{emp.transactions} transactions</span>
                      <span>Avg: {formatCurrency(emp.avgOrder)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-xs text-[#888] py-8 text-center">
            No employee performance data for today yet.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}