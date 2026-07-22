'use client';

import { useUIStore, useAuthStore, usePOSStore } from '@/lib/store';
import { Menu, Bell, Search, User, LogOut, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { formatCurrency } from '@/lib/constants';

export default function AppHeader() {
  const { currentView, setMobileMenuOpen, searchQuery, setSearchQuery } = useUIStore();
  const { currentEmployee, logout } = useAuthStore();
  const { clearCart } = usePOSStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showClosing, setShowClosing] = useState(false);
  const [closingData, setClosingData] = useState<any>(null);
  const [closingLoading, setClosingLoading] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [closingStep, setClosingStep] = useState<'summary' | 'close'>('summary');
  const [closingMsg, setClosingMsg] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const viewTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    pos: 'POS Terminal',
    products: 'Product Management',
    inventory: 'Inventory',
    customers: 'Customers',
    employees: 'Employees',
    reports: 'Reports',
    settings: 'Settings',
  };

  const handleSignOut = () => { setShowUserMenu(false); clearCart(); logout(); };

  const handleOpenClosing = async () => {
    setClosingLoading(true);
    setClosingStep('summary');
    setClosingMsg('');
    setClosingAmount('');
    try {
      const res = await fetch('/api/closing');
      const data = await res.json();
      setClosingData(data);
      if (!data.drawerId) setClosingStep('close');
    } catch { }
    setClosingLoading(true);
    setShowClosing(true);
    setTimeout(() => setClosingLoading(false), 300);
  };

  const handleOpenDrawer = async () => {
    const amt = parseFloat(openingAmount) || 0;
    await fetch('/api/closing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'OPEN', openingAmount: amt, employeeId: currentEmployee?.id }) });
    setClosingStep('summary');
    handleOpenClosing();
  };

  const handleCloseDrawer = async () => {
    const amt = parseFloat(closingAmount) || 0;
    const res = await fetch('/api/closing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'CLOSE', closingAmount: amt, employeeId: currentEmployee?.id }) });
    const data = await res.json();
    if (data.error) { setClosingMsg(data.error); return; }
    setClosingStep('summary');
    setClosingMsg('Day closed successfully!');
    handleOpenClosing();
  };

  const handlePrintClosing = () => {
    if (!closingData) return;
    const d = closingData;
    const w = window.open('', '_blank', 'width=400,height=700');
    if (w) {
      w.document.write(`<!DOCTYPE html><html><head><title>End of Day</title><style>body{font-family:monospace;padding:20px;font-size:12px}h1{text-align:center;font-size:16px}h2{font-size:13px;border-bottom:1px dashed #000;padding-bottom:4px;margin-top:12px}table{width:100%;border-collapse:collapse}td{padding:2px 4px}.r{text-align:right}.b{font-weight:bold}</style></head><body>`);
      w.document.write(`<h1>O'Galley</h1><p style="text-align:center;font-size:11px">End of Day Report - ${d.date}</p>`);
      w.document.write(`<h2>Summary</h2><table><tr><td>Total Revenue</td><td class="r b">${formatCurrency(d.totalRevenue)}</td></tr><tr><td>Net Sales</td><td class="r">${formatCurrency(d.netSales)}</td></tr><tr><td>Gross Profit</td><td class="r">${formatCurrency(d.grossProfit)}</td></tr><tr><td>Total Orders</td><td class="r">${d.totalOrders}</td></tr><tr><td>VAT Collected</td><td class="r">${formatCurrency(d.totalTax)}</td></tr><tr><td>Refunds/Voids</td><td class="r">${formatCurrency(d.totalRefund)}</td></tr></table>`);
      w.document.write(`<h2>Payment Breakdown</h2><table>${d.paymentBreakdown.map((p: any) => `<tr><td>${p.method}</td><td class="r">${formatCurrency(p.amount)}</td><td class="r">(${p.count})</td></tr>`).join('')}</table>`);
      w.document.write(`<h2>Cash Drawer</h2><table><tr><td>Opening</td><td class="r">${formatCurrency(d.openingAmount)}</td></tr><tr><td>Cash Sales</td><td class="r">${formatCurrency(d.cashTotal)}</td></tr><tr><td>Expected in Drawer</td><td class="r b">${formatCurrency(d.expectedCash)}</td></tr><tr><td>Non-Cash Sales</td><td class="r">${formatCurrency(d.nonCashTotal)}</td></tr></table>`);
      w.document.write('<p style="text-align:center;margin-top:20px;font-size:10px">--- End of Report ---</p>');
      w.document.write('</body></html>');
      w.document.close(); w.focus(); w.print();
    }
  };

  if (!currentEmployee) return null;

  return (
    <header className="h-16 border-b border-white/[0.06] flex items-center justify-between px-4 lg:px-6 shrink-0 glass-strong z-30">
      <div className="flex items-center gap-3">
        <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 rounded-lg text-[#888] hover:text-white hover:bg-white/[0.04] transition-colors"><Menu size={20} /></button>
        <div>
          <h2 className="text-lg font-semibold text-white">{viewTitles[currentView] || 'Dashboard'}</h2>
          <p className="text-[11px] text-[#888] -mt-0.5 hidden sm:block">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
      {currentView === 'pos' && (
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
            <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#C48A3A]/50 focus:bg-white/[0.07] transition-all" />
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button onClick={handleOpenClosing} className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-subtle text-xs text-[#888] hover:text-[#C48A3A] hover:bg-[#C48A3A]/10 transition-colors">
          <Lock size={14} /> Close Day
        </button>
        <button className="relative p-2 rounded-lg text-[#888] hover:text-white hover:bg-white/[0.04] transition-colors"><Bell size={18} /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C48A3A] rounded-full" /></button>
        <div ref={userMenuRef} className="relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-white/[0.04] transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C48A3A] to-[#A06E28] flex items-center justify-center"><User size={14} className="text-white" /></div>
            <div className="hidden sm:block text-left"><p className="text-xs font-medium text-white leading-tight">{currentEmployee.name}</p><p className="text-[10px] text-[#C48A3A] leading-tight">{currentEmployee.role}</p></div>
          </button>
          {showUserMenu && (
            <motion.div initial={{ opacity: 0, y: -4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }}
              className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#1E1E1E] border border-white/[0.08] shadow-2xl shadow-black/40 p-1.5 z-50">
              <div className="px-3 py-2 border-b border-white/[0.06] mb-1"><p className="text-xs font-medium text-white">{currentEmployee.name}</p><p className="text-[10px] text-[#888]">{currentEmployee.email}</p></div>
              <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"><LogOut size={14} /> Sign Out</button>
            </motion.div>
          )}
        </div>
      </div>
      {/* Closing Dialog */}
      <AnimatePresence>
        {showClosing && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" onClick={() => setShowClosing(false)} />
            <motion.div className="relative z-10 w-full max-w-lg glass-strong rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-white">{closingStep === 'close' && !closingData?.drawerId ? 'Open Cash Drawer' : 'End of Day'}</h2><button onClick={() => setShowClosing(false)} className="text-white/40 hover:text-white">X</button></div>
                {closingMsg && <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-400">{closingMsg}</div>}
                {closingLoading ? <div className="text-center py-8 text-[#888]">Loading...</div> : closingStep === 'close' && !closingData?.drawerId ? (
                  <div className="space-y-3"><p className="text-xs text-[#888]">No cash drawer is open. Enter the starting amount.</p><input type="number" value={openingAmount} onChange={e => setOpeningAmount(e.target.value)} placeholder="Opening amount..." className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#C48A3A]/50" /><button onClick={handleOpenDrawer} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#C48A3A] to-[#A06E28] text-white text-sm font-medium">Open Drawer</button></div>
                ) : closingData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">{[
                      { label: 'Total Revenue', value: formatCurrency(closingData.totalRevenue) },
                      { label: 'Net Sales', value: formatCurrency(closingData.netSales) },
                      { label: 'Gross Profit', value: formatCurrency(closingData.grossProfit) },
                      { label: 'Total Orders', value: String(closingData.totalOrders) },
                      { label: 'VAT Collected', value: formatCurrency(closingData.totalTax) },
                      { label: 'Refunds/Voids', value: formatCurrency(closingData.totalRefund) },
                    ].map(s => <div key={s.label} className="glass-subtle rounded-xl p-3"><p className="text-[10px] text-[#888]">{s.label}</p><p className="text-sm font-bold text-white">{s.value}</p></div>)}</div>
                    <div className="glass-subtle rounded-xl p-3 space-y-1.5"><h3 className="text-xs font-bold text-white mb-2">Payment Breakdown</h3>{closingData.paymentBreakdown.map((p: any) => <div key={p.method} className="flex justify-between text-xs"><span className="text-[#888]">{p.method}</span><span className="text-white">{formatCurrency(p.amount)} ({p.count})</span></div>)}</div>
                    <div className="glass-subtle rounded-xl p-3 space-y-1.5"><h3 className="text-xs font-bold text-white mb-2">Cash Drawer</h3><div className="flex justify-between text-xs"><span className="text-[#888]">Opening</span><span className="text-white">{formatCurrency(closingData.openingAmount)}</span></div><div className="flex justify-between text-xs"><span className="text-[#888]">Cash Sales</span><span className="text-white">{formatCurrency(closingData.cashTotal)}</span></div><div className="flex justify-between text-xs"><span className="text-[#888]">Expected</span><span className="text-[#C48A3A] font-bold">{formatCurrency(closingData.expectedCash)}</span></div></div>
                    {closingData.voidedOrders.length > 0 && <div className="glass-subtle rounded-xl p-3"><h3 className="text-xs font-bold text-red-400 mb-2">Voided / Refunded ({closingData.voidedOrders.length})</h3>{closingData.voidedOrders.map((v: any) => <div key={v.id} className="flex justify-between text-xs"><span className="text-[#888]">{v.orderNumber} ({v.status})</span><span className="text-red-400">-{formatCurrency(v.totalAmount)}</span></div>)}</div>}
                    {closingData.drawerId && closingStep === 'summary' && (<div className="space-y-3 pt-2"><div><p className="text-xs text-[#888] mb-1">Count the cash in the drawer and enter the actual amount:</p><input type="number" value={closingAmount} onChange={e => setClosingAmount(e.target.value)} placeholder="Actual cash in drawer..." className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#C48A3A]/50" autoFocus /></div><div className="grid grid-cols-2 gap-2"><button onClick={handleCloseDrawer} className="py-2.5 rounded-xl bg-gradient-to-r from-[#C48A3A] to-[#A06E28] text-white text-sm font-medium">Close Day</button><button onClick={handlePrintClosing} className="py-2.5 rounded-xl glass-subtle text-white/80 text-sm">Print Report</button></div></div>)}
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}