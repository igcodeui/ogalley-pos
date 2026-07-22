'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, Phone, Mail, MapPin, Percent, CreditCard, Shield, Database, Bell, Save, Check } from 'lucide-react';

export default function SettingsView() {
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', footerMessage: '' });
  const [taxForm, setTaxForm] = useState({ taxRate: '12', currency: 'PHP' });

  useEffect(() => {
    fetch('/api/store').then(r => r.json()).then(data => {
      if (data && !data.error) {
        setStore(data);
        setForm({ name: data.name || '', address: data.address || '', phone: data.phone || '', email: data.email || '', footerMessage: data.footerMessage || '' });
        setTaxForm({ taxRate: String((data.taxRate ?? 0.12) * 100), currency: data.currency || 'PHP' });
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async (data: Record<string, any>) => {
    setSaving(true); setSaved(false);
    try {
      const res = await fetch('/api/store', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { const d = await res.json(); setStore(d); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch (e) { alert('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-4 lg:p-6 space-y-6">{[1,2,3].map(i=><div key={i} className="h-48 rounded-2xl animate-shimmer bg-white/[0.03]" />)}</div>;

  const tabs = [
    { id: 'general', label: 'General', icon: <Store size={16} /> },
    { id: 'tax', label: 'Tax & Currency', icon: <Percent size={16} /> },
    { id: 'payment', label: 'Payments', icon: <CreditCard size={16} /> },
    { id: 'roles', label: 'Roles & Permissions', icon: <Shield size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'data', label: 'Data & Backup', icon: <Database size={16} /> },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Settings</h3>
        {saved && <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full"><Check size={12} /> Saved</motion.span>}
      </div>
      <div className="flex overflow-x-auto gap-1 p-1 bg-white/[0.03] rounded-xl">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${activeTab === tab.id ? 'bg-[#C48A3A]/20 text-[#C48A3A]' : 'text-[#888] hover:text-white hover:bg-white/[0.04]'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 max-w-2xl">
          <div className="premium-card p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2"><Store size={14} className="text-[#C48A3A]" /> Store Information</h4>
            {[
              { label: 'Store Name', key: 'name', icon: <Store size={14} /> },
              { label: 'Address', key: 'address', icon: <MapPin size={14} /> },
              { label: 'Phone', key: 'phone', icon: <Phone size={14} /> },
              { label: 'Email', key: 'email', icon: <Mail size={14} /> },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-[#888] mb-1.5 flex items-center gap-1.5"><span className="text-[#666]">{f.icon}</span>{f.label}</label>
                <input value={form[f.key as keyof typeof form] || ''} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#C48A3A]/50" />
              </div>
            ))}
            <div>
              <label className="text-xs text-[#888] mb-1.5 block">Receipt Footer</label>
              <textarea value={form.footerMessage} onChange={e => setForm(prev => ({ ...prev, footerMessage: e.target.value }))} rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#C48A3A]/50 resize-none" />
            </div>
            <button onClick={() => handleSave(form)} disabled={saving}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#C48A3A] to-[#A06E28] text-white text-sm font-medium hover:shadow-lg hover:shadow-[#C48A3A]/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      )}

      {activeTab === 'tax' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-4">
          <div className="premium-card p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2"><Percent size={14} className="text-[#C48A3A]" /> Tax Configuration</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#888] mb-1 block">Tax Rate (%)</label>
                <input value={taxForm.taxRate} onChange={e => setTaxForm(p => ({ ...p, taxRate: e.target.value }))} type="number" min="0" max="100" step="0.1"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#C48A3A]/50" />
              </div>
              <div>
                <label className="text-xs text-[#888] mb-1 block">Currency</label>
                <select value={taxForm.currency} onChange={e => setTaxForm(p => ({ ...p, currency: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#C48A3A]/50">
                  <option value="PHP" className="bg-[#1E1E1E]">PHP</option>
                  <option value="USD" className="bg-[#1E1E1E]">USD</option>
                </select>
              </div>
            </div>
            <div className="glass-subtle rounded-xl p-3 text-xs text-[#888] space-y-1">
              <p>Current tax rate: <span className="text-[#C48A3A] font-medium">{taxForm.taxRate}% VAT</span></p>
              <p>Tax-exempt transactions (Senior Citizen, PWD) will have 0% tax applied.</p>
            </div>
            <button onClick={() => handleSave({ taxRate: parseFloat(taxForm.taxRate) / 100, currency: taxForm.currency })} disabled={saving}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#C48A3A] to-[#A06E28] text-white text-sm font-medium hover:shadow-lg hover:shadow-[#C48A3A]/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
              <Save size={16} /> {saving ? 'Saving...' : 'Save Tax Settings'}
            </button>
          </div>
        </motion.div>
      )}

      {activeTab === 'payment' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-4">
          <div className="premium-card p-5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><CreditCard size={14} className="text-[#C48A3A]" /> Payment Methods</h4>
            <p className="text-xs text-[#888] mb-4">The POS records payment methods but does not process electronic payments directly.</p>
            {['Cash', 'Credit Card', 'Debit Card', 'GCash', 'Maya', 'Bank Transfer', 'Gift Certificate', 'Store Credit'].map(pm => (
              <div key={pm} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                <span className="text-sm text-white">{pm}</span>
                <div className="w-9 h-5 rounded-full bg-[#C48A3A]/30 p-0.5"><div className="w-4 h-4 rounded-full bg-[#C48A3A] ml-auto" /></div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'roles' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-4">
          <div className="premium-card p-5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Shield size={14} className="text-[#C48A3A]" /> Role Permissions</h4>
            <div className="space-y-3">
              {[
                { role: 'Owner', color: 'text-[#C48A3A]', perms: ['Full Access', 'All Settings', 'Employee Management', 'Financial Reports', 'Data Export', 'System Config'] },
                { role: 'Administrator', color: 'text-purple-400', perms: ['All Settings', 'Employee Management', 'Reports', 'Product Management', 'Inventory'] },
                { role: 'Manager', color: 'text-blue-400', perms: ['POS Access', 'Reports', 'Employee Scheduling', 'Inventory', 'Refunds'] },
                { role: 'Cashier', color: 'text-green-400', perms: ['POS Access', 'View Own Sales', 'Hold/Resume Orders'] },
                { role: 'Inventory Staff', color: 'text-orange-400', perms: ['Inventory Management', 'Stock Adjustments', 'Purchase Orders', 'Waste Logging'] },
              ].map(r => (
                <div key={r.role} className="glass-subtle rounded-xl p-4">
                  <p className={`text-sm font-bold ${r.color} mb-2`}>{r.role}</p>
                  <div className="flex flex-wrap gap-1.5">{r.perms.map(p => <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-[#888]">{p}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-4">
          <div className="premium-card p-5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Bell size={14} className="text-[#C48A3A]" /> Notification Preferences</h4>
            {[
              { label: 'Low Stock Alerts', desc: 'Notify when product stock falls below minimum level', on: true },
              { label: 'Expiring Inventory', desc: 'Alert for products approaching expiration date', on: true },
              { label: 'Refund Completed', desc: 'Notification when a refund is processed', on: true },
              { label: 'Employee Clock In/Out', desc: 'Track employee attendance events', on: false },
              { label: 'Daily Closing Reminder', desc: 'Reminder to close the cash drawer at end of day', on: true },
              { label: 'Backup Completed', desc: 'Confirm automatic data backup success', on: false },
            ].map(n => (
              <div key={n.label} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                <div><p className="text-sm text-white">{n.label}</p><p className="text-xs text-[#888]">{n.desc}</p></div>
                <div className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${n.on ? 'bg-[#C48A3A]/30' : 'bg-white/[0.1]'}`}>
                  <div className={`w-4 h-4 rounded-full transition-all ${n.on ? 'bg-[#C48A3A] ml-auto' : 'bg-[#888]'}`} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'data' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-4">
          <div className="premium-card p-5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Database size={14} className="text-[#C48A3A]" /> Data & Backup</h4>
            <div className="glass-subtle rounded-xl p-4">
              <p className="text-sm text-white mb-1">Database Hosting</p>
              <p className="text-xs text-[#888]">Hosted on Turso Cloud with automatic backups included.</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}