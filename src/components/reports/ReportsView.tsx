'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, ShoppingBag, DollarSign, Download, Calendar, Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/constants';

const PERIODS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

export default function ReportsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?period=${period}&date=${date}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period, date]);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank', 'width=800,height=900');
      if (printWindow) {
        printWindow.document.write(`<!DOCTYPE html><html><head><title>O'Galley Report</title>
          <style>body{font-family:monospace;padding:24px;color:#111;font-size:12px}
          h1{font-size:18px;margin:0 0 4px}h2{font-size:14px;margin:16px 0 8px;border-bottom:1px solid #ccc;padding-bottom:4px}
          .meta{color:#666;margin-bottom:16px;font-size:11px}
          table{width:100%;border-collapse:collapse;margin:8px 0}
          th,td{text-align:left;padding:4px 8px;border-bottom:1px solid #eee}
          th{font-weight:bold;background:#f5f5f5}
          td.num{text-align:right}
          .summary{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}
          .summary .item{background:#f9f9f9;padding:8px;border-radius:4px}
          .summary .label{color:#666;font-size:10px}
          .summary .value{font-size:16px;font-weight:bold;margin-top:2px}
          .right{text-align:right}.bold{font-weight:bold}
          @media print{body{padding:12px}}</style></head><body>);
        printWindow.document.write(printRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    }
  };

  if (loading || !data) return <div className="p-4 lg:p-6 space-y-6">{[1,2,3,4].map(i=><div key={i} className="h-24 rounded-2xl animate-shimmer bg-white/[0.03]" />)}</div>;

  const summary = data.summary || data.totals || {};
  const orders = data.orders || [];
  const dailyBreakdown = data.dailyBreakdown || [];
  const weeklyBreakdown = data.weeklyBreakdown || [];
  const topProducts = data.topProducts || summary.topProducts || [];
  const paymentBreakdown = data.paymentBreakdown || summary.paymentBreakdown || [];
  const hourlyBreakdown = data.hourlyBreakdown || summary.hourlyBreakdown || [];

  const totalRevenue = summary.totalRevenue || 0;
  const totalOrders = summary.totalOrders || orders.length;
  const grossProfit = summary.grossProfit || 0;
  const totalCost = summary.totalCost || 0;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Reports</h3>
          <p className="text-sm text-[#888]">Generate and print daily, weekly, or monthly reports</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-white/[0.04] rounded-xl p-1">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p.value ? 'bg-[#C48A3A]/20 text-[#C48A3A]' : 'text-[#888] hover:text-white'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#C48A3A]/50" />
          <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#C48A3A] to-[#A06E28] text-xs text-white font-medium hover:shadow-lg hover:shadow-[#C48A3A]/20 transition-all">
            <Printer size={14} /> Print / PDF
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: <DollarSign size={18} className="text-[#C48A3A]" /> },
          { label: 'Total Orders', value: totalOrders.toLocaleString(), icon: <ShoppingBag size={18} className="text-blue-400" /> },
          { label: 'Avg Order Value', value: formatCurrency(avgOrder), icon: <BarChart3 size={18} className="text-green-400" /> },
          { label: 'Gross Profit', value: formatCurrency(grossProfit), icon: <TrendingUp size={18} className="text-purple-400" /> },
          { label: 'Total Cost', value: formatCurrency(totalCost), icon: <DollarSign size={18} className="text-red-400" /> },
        ].map(s => (
          <div key={s.label} className="premium-card p-4">
            <div className="flex items-center gap-2 mb-1"><span className="text-xs text-[#888]">{s.icon}</span><span className="text-xs text-[#888]">{s.label}</span></div>
            <p className="text-xl lg:text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Hidden print content */}
      <div ref={printRef} className="hidden">
        <div className="print-report">
          <h1>O'Galley - {period.charAt(0).toUpperCase() + period.slice(1)} Report</h1>
          <p className="meta">Date: {date} | Generated: {new Date().toLocaleString()}</p>
          <div className="summary">
            <div className="item"><div className="label">Total Revenue</div><div className="value">{formatCurrency(totalRevenue)}</div></div>
            <div className="item"><div className="label">Total Orders</div><div className="value">{totalOrders}</div></div>
            <div className="item"><div className="label">Avg Order</div><div className="value">{formatCurrency(avgOrder)}</div></div>
            <div className="item"><div className="label">Gross Profit</div><div className="value">{formatCurrency(grossProfit)}</div></div>
          </div>
          {paymentBreakdown.length > 0 && (<><h2>Payment Methods</h2><table><thead><tr><th>Method</th><th className="right">Amount</th><th className="right">Count</th></tr></thead><tbody>
            {paymentBreakdown.map((pm: any) => <tr key={pm.method}><td>{(pm.method || '').replace(/_/g, ' ')}</td><td className="num">{formatCurrency(pm.amount)}</td><td className="num">{pm.count}</td></tr>)}
          </tbody></table></>)}
          {topProducts.length > 0 && (<><h2>Top Products</h2><table><thead><tr><th>#</th><th>Product</th><th className="right">Qty</th><th className="right">Revenue</th></tr></thead><tbody>
            {topProducts.map((p: any, i: number) => <tr key={i}><td>{i + 1}</td><td>{p.name || p.productName}</td><td className="num">{p.quantity || p.qty}</td><td className="num">{formatCurrency(p.revenue)}</td></tr>)}
          </tbody></table></>)}
          {(dailyBreakdown.length > 0 || weeklyBreakdown.length > 0) && (<><h2>Daily Breakdown</h2><table><thead><tr><th>Date</th><th className="right">Orders</th><th className="right">Revenue</th><th className="right">Avg Order</th></tr></thead><tbody>
            {(period === 'monthly' ? weeklyBreakdown : dailyBreakdown).map((d: any, i: number) => <tr key={i}><td>{d.date || `${d.weekStart} - ${d.weekEnd}`}</td><td className="num">{d.totalOrders || d.orders}</td><td className="num">{formatCurrency(d.totalRevenue || d.revenue)}</td><td className="num">{formatCurrency(d.avgOrderValue || (d.totalOrders > 0 ? d.totalRevenue / d.totalOrders : 0))}</td></tr>)}
          </tbody></table></>)}
          {hourlyBreakdown.length > 0 && (<><h2>Hourly Breakdown</h2><table><thead><tr><th>Hour</th><th className="right">Orders</th><th className="right">Revenue</th></tr></thead><tbody>
            {hourlyBreakdown.map((h: any) => <tr key={h.hour}><td>{h.hour}</td><td className="num">{h.orders}</td><td className="num">{formatCurrency(h.revenue)}</td></tr>)}
          </tbody></table></>)}
          <p style="text-align:center;color:#999;margin-top:24px;font-size:10px">O'Galley POS System - Generated Report</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Method Breakdown */}
        {paymentBreakdown.length > 0 && (
          <div className="premium-card p-5">
            <h4 className="text-sm font-bold text-white mb-4">Payment Methods</h4>
            <div className="space-y-3">
              {paymentBreakdown.map((pm: any) => (
                <div key={pm.method}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#888]">{(pm.method || '').replace(/_/g, ' ')}</span>
                    <span className="text-white">{totalRevenue > 0 ? ((pm.amount / totalRevenue) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${totalRevenue > 0 ? (pm.amount / totalRevenue) * 100 : 0}%` }} transition={{ duration: 0.6 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#C48A3A] to-[#D4A050]" />
                  </div>
                  <p className="text-[10px] text-[#888] mt-0.5">{formatCurrency(pm.amount)} ({pm.count} txns)</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Products */}
        {topProducts.length > 0 && (
          <div className={`${paymentBreakdown.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'} premium-card p-5`}>
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
                  {topProducts.map((p: any, i: number) => (
                    <tr key={i} className="border-b border-white/[0.04]">
                      <td className="py-2 text-xs text-[#888]">{i + 1}</td>
                      <td className="py-2 text-sm text-white font-medium">{p.name || p.productName}</td>
                      <td className="py-2 text-sm text-[#888] text-right">{p.quantity || p.qty}</td>
                      <td className="py-2 text-sm text-[#C48A3A] font-medium text-right">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Hourly Breakdown */}
      {hourlyBreakdown.length > 0 && (
        <div className="premium-card p-5">
          <h4 className="text-sm font-bold text-white mb-4">Hourly Sales</h4>
          <div className="flex items-end gap-1 h-32">
            {hourlyBreakdown.map((h: any) => {
              const maxRev = Math.max(...hourlyBreakdown.map((x: any) => x.revenue), 1);
              const pct = (h.revenue / maxRev) * 100;
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-[#888]">{formatCurrency(h.revenue)}</span>
                  <div className="w-full bg-gradient-to-t from-[#C48A3A] to-[#D4A050] rounded-t-sm transition-all" style={{ height: `${Math.max(pct, 4)}%` }} />
                  <span className="text-[9px] text-[#888]">{h.hour.replace(':00', '')}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily/Weekly Breakdown Table */}
      <div className="premium-card p-5">
        <h4 className="text-sm font-bold text-white mb-4"><Calendar size={14} className="inline mr-1.5" />{period === 'monthly' ? 'Weekly Breakdown' : 'Daily Breakdown'}</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/[0.06]">
              <th className="text-left text-xs font-medium text-[#888] pb-2">Date</th>
              <th className="text-right text-xs font-medium text-[#888] pb-2">Orders</th>
              <th className="text-right text-xs font-medium text-[#888] pb-2">Revenue</th>
              <th className="text-right text-xs font-medium text-[#888] pb-2">Avg Order</th>
            </tr></thead>
            <tbody>
              {(period === 'monthly' ? weeklyBreakdown : dailyBreakdown).map((d: any, i: number) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  <td className="py-2.5 text-sm text-white">{d.date || `${d.weekStart} - ${d.weekEnd}`}</td>
                  <td className="py-2.5 text-sm text-[#888] text-right">{d.totalOrders || d.orders}</td>
                  <td className="py-2.5 text-sm text-[#C48A3A] font-medium text-right">{formatCurrency(d.totalRevenue || d.revenue)}</td>
                  <td className="py-2.5 text-sm text-[#888] text-right">{formatCurrency(d.avgOrderValue || (d.orders > 0 ? d.revenue / d.orders : 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}