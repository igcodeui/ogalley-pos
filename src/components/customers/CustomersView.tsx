'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Crown, Star, Gem, UserCircle, X } from 'lucide-react';
import type { Customer } from '@/lib/types';
import { formatCurrency, MEMBERSHIP_THRESHOLDS } from '@/lib/constants';

const BADGE_COLORS: Record<string, { bg: string; text: string; color: string; icon: any }> = {
  BRONZE: { bg: 'bg-[#CD7F32]/10', text: 'text-[#CD7F32]', color: '#CD7F32', icon: UserCircle },
  SILVER: { bg: 'bg-[#C0C0C0]/10', text: 'text-[#C0C0C0]', color: '#C0C0C0', icon: Star },
  GOLD: { bg: 'bg-[#FFD700]/10', text: 'text-[#FFD700]', color: '#FFD700', icon: Crown },
  PLATINUM: { bg: 'bg-[#E5E4E2]/10', text: 'text-[#E5E4E2]', color: '#E5E4E2', icon: Gem },
};

export default function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(data => { setCustomers(data || []); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.email || '').toLowerCase().includes(q));
  }, [customers, search]);

  const stats = useMemo(() => ({
    total: customers.length,
    members: customers.filter(c => c.loyaltyPoints > 0).length,
    totalPoints: customers.reduce((s, c) => s + c.loyaltyPoints, 0),
    totalSpent: customers.reduce((s, c) => s + c.totalSpent, 0),
  }), [customers]);

  if (loading) return <div className="p-4 lg:p-6 space-y-6">{[1,2,3,4].map(i=><div key={i} className="h-24 rounded-2xl animate-shimmer bg-white/[0.03]" />)}</div>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-white">Customers</h3>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#C48A3A]/50" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Customers', value: stats.total, icon: <Users size={18} className="text-[#C48A3A]" /> },
          { label: 'Loyalty Members', value: stats.members, icon: <Star size={18} className="text-yellow-400" /> },
          { label: 'Total Points', value: stats.totalPoints.toLocaleString(), icon: <Gem size={18} className="text-purple-400" /> },
          { label: 'Total Revenue', value: formatCurrency(stats.totalSpent), icon: <Crown size={18} className="text-green-400" /> },
        ].map(s => (
          <div key={s.label} className="premium-card p-4">
            <div className="flex items-center gap-2 mb-2"><span className="text-[#888] text-xs">{s.icon}</span><span className="text-xs text-[#888]">{s.label}</span></div>
            <p className="text-lg font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((c, i) => {
          const badge = BADGE_COLORS[c.membershipLevel] || BADGE_COLORS.BRONZE;
          const BadgeIcon = badge.icon;
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="premium-card p-4 cursor-pointer" onClick={() => setSelectedCust(c)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C48A3A]/20 to-[#3B2A20]/50 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#C48A3A]">{c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{c.name}</p>
                    <p className="text-xs text-[#888]">{c.phone || 'No phone'}</p>
                  </div>
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                  <BadgeIcon size={10} />{c.membershipLevel}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="glass-subtle rounded-lg p-2">
                  <p className="text-xs text-[#888]">Visits</p>
                  <p className="text-sm font-bold text-white">{c.totalVisits}</p>
                </div>
                <div className="glass-subtle rounded-lg p-2">
                  <p className="text-xs text-[#888]">Points</p>
                  <p className="text-sm font-bold text-[#C48A3A]">{c.loyaltyPoints}</p>
                </div>
                <div className="glass-subtle rounded-lg p-2">
                  <p className="text-xs text-[#888]">Spent</p>
                  <p className="text-sm font-bold text-white">{formatCurrency(c.totalSpent)}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Customer Detail Dialog */}
      {selectedCust && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedCust(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#1A1A1A] border border-white/[0.08] rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Customer Details</h3>
              <button onClick={() => setSelectedCust(null)} className="p-1.5 rounded-lg text-[#888] hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[#888]">Name</span><span className="text-white font-medium">{selectedCust.name}</span></div>
              <div className="flex justify-between"><span className="text-[#888]">Phone</span><span className="text-white">{selectedCust.phone || '—'}</span></div>
              <div className="flex justify-between"><span className="text-[#888]">Email</span><span className="text-white">{selectedCust.email || '—'}</span></div>
              <div className="flex justify-between"><span className="text-[#888]">Membership</span><span className={`font-medium ${BADGE_COLORS[selectedCust.membershipLevel]?.text}`}>{selectedCust.membershipLevel}</span></div>
              <div className="flex justify-between"><span className="text-[#888]">Loyalty Points</span><span className="text-[#C48A3A] font-bold">{selectedCust.loyaltyPoints} pts</span></div>
              <div className="flex justify-between"><span className="text-[#888]">Cashback</span><span className="text-white">{formatCurrency(selectedCust.cashbackBalance)}</span></div>
              <div className="flex justify-between"><span className="text-[#888]">Total Spent</span><span className="text-white font-bold">{formatCurrency(selectedCust.totalSpent)}</span></div>
              <div className="flex justify-between"><span className="text-[#888]">Total Visits</span><span className="text-white">{selectedCust.totalVisits}</span></div>
              {selectedCust.birthday && <div className="flex justify-between"><span className="text-[#888]">Birthday</span><span className="text-white">{new Date(selectedCust.birthday).toLocaleDateString()}</span></div>}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}