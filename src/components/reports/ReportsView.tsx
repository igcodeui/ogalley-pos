'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, ShoppingBag, DollarSign, Download, Calendar } from 'lucide-react';
import type { Order } from '@/lib/types';
import { formatCurrency } from '@/lib/constants';

const RANGES = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: 'This Month', days: 0 },
  { label: 'This Year', days: 365 },
];

export default function ReportsView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(7);

  useEffect(() => {
    let cancelled = false;
    const to = new Date().toISOString();
    const from = new Date(Date.now() - range * 86400000).toISOString();
    fetch(`/api/orders?from=${from}&to=${to}`).then(r => r.json()).then(data => {
      if (!cancelled) {
        setOrders((data || []).filter((o: Order) => o.status === 'COMPLETED'));
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [range]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    const totalOrders = orders.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalProfit = orders.reduce((s, o) => s + (o.items || []).reduce((ps, item: any) => ps + (item.profit || 0), 0), 0);
    return { totalRevenue, totalOrders, avgOrder, totalProfit };
  }, [orders]);

  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => { map[o.paymentMethod] = (map[o.paymentMethod] || 0) + o.totalAmount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([method, amount]) => ({
      method: method.replace(/_/g, ' '),
      amount,
      pct: stats.totalRevenue > 0 ? (amount / stats.totalRevenue * 100) : 0,
    }));
  }, [orders, stats.totalRevenue]);

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    orders.forEach(o => (o.items || []).forEach((item: any) => {
      if (!map[item.productId]) map[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
      map[item.productId].qty += item.quantity;
      map[item.productId].revenue += item.subtotal;
    }));
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [orders]);

  const dailySales = useMemo(() => {
    const map: Record<string, { date: string; orders: number; revenue: number }> = {};
    orders.forEach(o => {
      const d = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!map[d]) map[d] = { date: d, orders: 0, revenue: 0 };
      map[d].orders++;
      map[d].revenue += o.totalAmount;
    });
    return Object.values(map).reverse().slice(0, 14);
  }, [orders]);

  if (loading) return <div className="p-4 lg:p-6 space-y-6">{[1,2,3,4].map(i=><div key={i} className="h-24 rounded-2xl animate-shimmer bg-white/[0.03]" />)}</div>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Reports</h3>
          <p className="text-sm text-[#888]">{RANGES.find(r => r.days === range)?.label || 'Custom'} overview</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/[0.04] rounded-xl p-1">
            {RANGES.map(r => (
              <button key={r.label} onClick={() => setRange(r.days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${range === r.days ? 'bg-[#C48A3A]/20 text-[#C48A3A]' : 'text-[#888] hover:text-white'}`}>
                {r.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-subtle text-xs text-[#888] hover:text-white transition-colors">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: <DollarSign size={18} className="text-[#C48A3A]" />, cls: 'kpi-revenue' },
          { label: 'Total Orders', value: stats.totalOrders.toLocaleString(), icon: <ShoppingBag size={18} className="text-blue-400" />, cls: 'kpi-transactions' },
          { label: 'Avg Order Value', value: formatCurrency(stats.avgOrder), icon: <BarChart3 size={18} className="text-green-400" />, cls: 'kpi-profit' },
          { label: 'Total Profit', value: formatCurrency(stats.totalProfit), icon: <TrendingUp size={18} className="text-purple-400" />, cls: 'kpi-customers' },
        ].map(s => (
          <div key={s.label} className={`premium-card p-4 ${s.cls}`}>
            <div className="flex items-center gap-2 mb-1"><span className="text-xs text-[#888]">{s.icon}</span><span className="text-xs text-[#888]">{s.label}</span></div>
            <p className="text-xl lg:text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Method Breakdown */}
        <div className="premium-card p-5">
          <h4 className="text-sm font-bold text-white mb-4">Payment Methods</h4>
          <div className="space-y-3">
            {paymentBreakdown.map(pm => (
              <div key={pm.method}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#888]">{pm.method}</span>
                  <span className="text-white">{pm.pct.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pm.pct}%` }} transition={{ duration: 0.6 }}
                    className="h-full rounded-full bg-gradient-to-r from-[#C48A3A] to-[#D4A050]" />
                </div>
                <p className="text-[10px] text-[#888] mt-0.5">{formatCurrency(pm.amount)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="lg:col-span-2 premium-card p-5">
          <h4 className="text-sm font-bold text-white mb-4">Top Products</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-medium text-[#888] pb-2">#</th>
                <th className="text-left text-xs font-medium text-[#888] pb-2">Product</th>
                <th className="text-right text-xs font-medium text-[#888] pb-2">Qty</th>
                <th className="text-right text-xs font-medium text-[#888] pb-2">Revenue</th>
              </tr></thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    <td className="py-2 text-xs text-[#888]">{i + 1}</td>
                    <td className="py-2 text-sm text-white font-medium">{p.name}</td>
                    <td className="py-2 text-sm text-[#888] text-right">{p.qty}</td>
                    <td className="py-2 text-sm text-[#C48A3A] font-medium text-right">{formatCurrency(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Daily Sales Table */}
      <div className="premium-card p-5">
        <h4 className="text-sm font-bold text-white mb-4">
          <Calendar size={14} className="inline mr-1.5" />Daily Breakdown
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/[0.06]">
              {['Date', 'Orders', 'Revenue', 'Avg Order'].map(h => (
                <th key={h} className="text-left text-xs font-medium text-[#888] pb-2">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {dailySales.map((d, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  <td className="py-2.5 text-sm text-white">{d.date}</td>
                  <td className="py-2.5 text-sm text-[#888]">{d.orders}</td>
                  <td className="py-2.5 text-sm text-[#C48A3A] font-medium">{formatCurrency(d.revenue)}</td>
                  <td className="py-2.5 text-sm text-[#888]">{formatCurrency(d.orders > 0 ? d.revenue / d.orders : 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}