'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, TrendingDown, X, ArrowUpDown } from 'lucide-react';
import type { InventoryItem } from '@/lib/types';
import { formatCurrency } from '@/lib/constants';

export default function InventoryView() {
  const [items, setItems] = useState<(InventoryItem & { productName: string; productSku: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('RESTOCK');

  useEffect(() => {
    fetch('/api/inventory').then(r => r.json()).then(data => {
      const mapped = (data || []).map((inv: any) => ({
        ...inv,
        productName: inv.product?.name || 'Unknown',
        productSku: inv.product?.sku || '',
      }));
      setItems(mapped);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!search) return items;
    return items.filter(i => i.productName.toLowerCase().includes(search.toLowerCase()) || i.productSku.toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  const totalValue = items.reduce((s, i) => s + i.currentStock * i.costPrice, 0);
  const lowStockCount = items.filter(i => i.currentStock <= i.minStock).length;
  const outOfStock = items.filter(i => i.currentStock === 0).length;

  const handleAdjust = async () => {
    if (!adjustId || !adjustQty) return;
    const item = items.find(i => i.id === adjustId);
    if (!item) return;
    const newStock = item.currentStock + Number(adjustQty);
    if (newStock < 0) return;

    try {
      const res = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: adjustId, currentStock: newStock }),
      });
      if (res.ok) {
        setItems(prev => prev.map(i => i.id === adjustId ? { ...i, currentStock: newStock } : i));
        setAdjustId(null); setAdjustQty(''); setAdjustReason('RESTOCK');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to adjust stock');
      }
    } catch {
      alert('Network error');
    }
  };

  if (loading) return <div className="p-4 lg:p-6 space-y-6">{[1,2,3,4].map(i=><div key={i} className="h-24 rounded-2xl animate-shimmer bg-white/[0.03]" />)}</div>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-white">Inventory</h3>
        <div className="relative w-full sm:w-72">
          <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#C48A3A]/50" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Value', value: formatCurrency(totalValue), color: 'text-[#C48A3A]', icon: <Package size={18} /> },
          { label: 'Low Stock', value: String(lowStockCount), color: 'text-yellow-400', icon: <AlertTriangle size={18} /> },
          { label: 'Out of Stock', value: String(outOfStock), color: 'text-red-400', icon: <TrendingDown size={18} /> },
        ].map(s => (
          <div key={s.label} className="premium-card p-4 min-w-0">
            <div className="flex items-center gap-2 text-[#888] mb-1"><span className={`shrink-0 ${s.color}`}>{s.icon}</span><span className="text-xs truncate">{s.label}</span></div>
            <p className={`text-base sm:text-lg font-bold ${s.color} truncate`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table - Desktop */}
      <div className="hidden lg:block premium-card overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-white/[0.06]">
            {['Product', 'SKU', 'Stock', 'Min', 'Unit', 'Value', 'Status', ''].map(h => (
              <th key={h} className="text-left text-xs font-medium text-[#888] px-4 py-3 uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((item, i) => {
              const status = item.currentStock === 0 ? 'Out' : item.currentStock <= item.minStock ? 'Low' : 'In Stock';
              const statusColor = item.currentStock === 0 ? 'bg-red-500/10 text-red-400' : item.currentStock <= item.minStock ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400';
              return (
                <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-white">{item.productName}</td>
                  <td className="px-4 py-3 text-sm text-[#888] font-mono">{item.productSku}</td>
                  <td className="px-4 py-3 text-sm font-bold text-white">{item.currentStock}</td>
                  <td className="px-4 py-3 text-sm text-[#888]">{item.minStock}</td>
                  <td className="px-4 py-3 text-sm text-[#888]">{item.unit}</td>
                  <td className="px-4 py-3 text-sm text-[#888]">{formatCurrency(item.currentStock * item.costPrice)}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>{status}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => setAdjustId(item.id)} className="flex items-center gap-1 text-xs text-[#C48A3A] hover:text-[#D4A050] transition-colors">
                      <ArrowUpDown size={12} /> Adjust
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.map((item, i) => {
          const status = item.currentStock === 0 ? 'Out' : item.currentStock <= item.minStock ? 'Low' : 'In Stock';
          const statusColor = item.currentStock === 0 ? 'bg-red-500/10 text-red-400' : item.currentStock <= item.minStock ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400';
          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="premium-card p-4 min-w-0">
              <div className="flex items-center justify-between mb-2 min-w-0">
                <p className="text-sm font-medium text-white truncate mr-2">{item.productName}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>{status}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#888]">
                <span>Stock: <b className="text-white">{item.currentStock}</b> / {item.minStock} {item.unit}</span>
                <span className="truncate ml-2">Value: <b className="text-white">{formatCurrency(item.currentStock * item.costPrice)}</b></span>
              </div>
              <button onClick={() => setAdjustId(item.id)} className="mt-2 text-xs text-[#C48A3A] hover:text-[#D4A050]">
                <ArrowUpDown size={12} className="inline mr-1" />Adjust Stock
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Adjust Dialog */}
      {adjustId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setAdjustId(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-[#1A1A1A] border border-white/[0.08] rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Adjust Stock</h3>
              <button onClick={() => setAdjustId(null)} className="p-1.5 rounded-lg text-[#888] hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-xs text-[#888] mb-1 block">Quantity Change (+/-)</label>
                <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="e.g. +50 or -5"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#C48A3A]/50" /></div>
              <div><label className="text-xs text-[#888] mb-1 block">Reason</label>
                <select value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#C48A3A]/50">
                  <option className="bg-[#1E1E1E]" value="RESTOCK">Restock</option>
                  <option className="bg-[#1E1E1E]" value="ADJUSTMENT">Adjustment</option>
                  <option className="bg-[#1E1E1E]" value="WASTE">Waste</option>
                  <option className="bg-[#1E1E2E]" value="SPOILAGE">Spoilage</option>
                </select></div>
              <button onClick={handleAdjust} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#C48A3A] to-[#A06E28] text-white text-sm font-medium hover:shadow-lg hover:shadow-[#C48A3A]/20 transition-all">
                Apply Adjustment
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}